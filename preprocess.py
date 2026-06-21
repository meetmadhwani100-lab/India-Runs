import json
import gzip
import datetime
import math
import os
from dateutil import parser
import pandas as pd
import numpy as np
import re
from collections import Counter, defaultdict

def normalize_skill(skill_name):
    s = str(skill_name).lower().strip()
    s = re.sub(r'[^a-z0-9\s]', '', s) # remove special chars
    
    # Simple semantic grouping
    if s in ['python', 'python 3', 'python3']: return 'python'
    if s in ['pytorch']: return 'pytorch'
    if s in ['llm', 'llms', 'large language models', 'large language model']: return 'llm'
    if s in ['nlp', 'natural language processing']: return 'nlp'
    if s in ['vector database', 'vector db', 'vectordb']: return 'vector-database'
    if s in ['information retrieval', 'ir']: return 'information-retrieval'
    if s in ['sentence transformers', 'sentencetransformers']: return 'sentence-transformers'
    if s in ['machine learning', 'ml']: return 'machine-learning'
    if s in ['deep learning', 'dl']: return 'deep-learning'
    if s in ['huggingface', 'hugging face']: return 'hugging face'
    if s in ['ab testing']: return 'a/b testing'
    if s in ['evaluation frameworks']: return 'evaluation-frameworks'
    if s in ['recommendation systems', 'recsys']: return 'recommendation-systems'
    if s in ['data pipelines', 'data pipeline']: return 'data-pipelines'
    
    return s.replace(' ', '-') # use hyphens for multi-word

def parse_date(d_str):
    if not d_str:
        return None
    try:
        return parser.parse(d_str).replace(tzinfo=None)
    except:
        return None

def run_preprocessing(input_file='candidates.jsonl', features_out='dataset/features.parquet', metadata_out='dataset/metadata.parquet'):
    print(f"Starting preprocessing on {input_file}...")
    start_time = datetime.datetime.now()
    
    # Trackers for Step 1
    total_records = 0
    missing_certs = 0
    missing_langs = 0
    missing_grades = 0
    missing_github = 0
    
    years_of_exp_dist = []
    countries_dist = []
    industry_dist = []
    company_size_dist = []
    
    pref_work_modes = set()
    open_to_work_flags = set()
    all_skills = Counter()
    
    features_list = []
    metadata_list = []
    
    today = datetime.datetime.now()
    
    tier_1_cities = {'pune', 'noida', 'bengaluru', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'new delhi'}
    services_companies = {'tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'capgemini', 'hcl', 'tech mahindra'}
    
    core_skills = {'python', 'embeddings', 'vector-database', 'retrieval', 'ranking', 'information-retrieval', 'nlp', 'transformers', 'sentence-transformers', 'faiss', 'pinecone', 'weaviate', 'qdrant', 'elasticsearch', 'opensearch'}
    strong_skills = {'llm', 'fine-tuning', 'lora', 'learning-to-rank', 'xgboost', 'a/b testing', 'evaluation-frameworks', 'ndcg', 'mlflow', 'hugging face'}
    adjacent_skills = {'recommendation-systems', 'search', 'data-pipelines', 'spark', 'deep-learning', 'pytorch', 'tensorflow'}
    
    # NLP vs CV terms
    nlp_terms = core_skills | strong_skills | {'nlp', 'text', 'language'}
    cv_terms = {'cv', 'computer-vision', 'robotics', 'speech', 'audio', 'image', 'video', 'opencv', 'yolo', 'cnn'}
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            cand = json.loads(line)
            if not cand:
                continue
            total_records += 1
            
            c_id = cand.get('candidate_id')
            profile = cand.get('profile') or {}
            career = cand.get('career_history') or []
            education = cand.get('education') or []
            skills = cand.get('skills') or []
            certs = cand.get('certifications') or []
            langs = cand.get('languages') or []
            signals = cand.get('redrob_signals') or {}
            
            # Step 1 stats
            if not certs: missing_certs += 1
            if not langs: missing_langs += 1
            grades = [e.get('grade') for e in education if e and e.get('grade')]
            if not grades: missing_grades += 1
            github_score_raw = signals.get('github_activity_score')
            if github_score_raw is not None and github_score_raw == -1: missing_github += 1
            
            yoe = profile.get('years_of_experience')
            if yoe is not None: years_of_exp_dist.append(yoe)
            countries_dist.append(profile.get('country'))
            industry_dist.append(profile.get('current_industry'))
            company_size_dist.append(profile.get('current_company_size'))
            
            pref_work_modes.add(signals.get('preferred_work_mode'))
            open_to_work_flags.add(signals.get('open_to_work_flag'))
            
            # Step 2: Cleaning
            yoe = float(yoe) if yoe is not None else 0.0
            yoe = max(0.0, min(40.0, yoe))
            
            loc = str(profile.get('location') or '')
            is_pref_loc = False
            for city in tier_1_cities:
                if city in loc.lower():
                    is_pref_loc = True
                    break
            
            will_relocate = bool(signals.get('willing_to_relocate') or False)
            country = str(profile.get('country') or '').strip().lower()
            
            size_map = {"1-10": 5, "11-50": 30, "51-200": 125, "201-500": 350, "501-1000": 750, "1001-5000": 3000, "5001-10000": 7500, "10001+": 10000}
            curr_size_str = str(profile.get('current_company_size') or '')
            curr_size = size_map.get(curr_size_str, -1)
            
            is_services_curr = any(sc in str(profile.get('current_company') or '').lower() for sc in services_companies)
            is_services_any = is_services_curr
            
            # Skills processing
            prof_map = {'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4}
            cand_skills = {}
            expert_0_dur_count = 0
            
            has_nlp = False
            has_cv = False
            
            for sk in skills:
                if not sk: continue
                name = normalize_skill(sk.get('name') or '')
                if not name: continue
                all_skills[name] += 1
                p = prof_map.get(str(sk.get('proficiency') or 'beginner').lower(), 1)
                dur = sk.get('duration_months')
                dur = int(dur) if dur is not None else 0
                endrs = sk.get('endorsements')
                endrs = int(endrs) if endrs is not None else 0
                cand_skills[name] = (p, dur, endrs)
                
                if p == 4 and dur == 0:
                    expert_0_dur_count += 1
                
                if name in nlp_terms: has_nlp = True
                if name in cv_terms: has_cv = True
                
            is_purely_non_nlp = has_cv and not has_nlp
            
            # Career
            dur_discrepancy = False
            career_gaps_count = 0
            longest_gap = 0
            tenures = []
            is_job_hopper = False
            product_company_months = 0
            total_career_months = 0
            has_prod_deployment = False
            is_services_only = True
            career_impossible_dates = False
            impossible_founding = False
            ai_relevance_score = 0.0
            
            parsed_roles = []
            for role in career:
                if not role: continue
                s_date = parse_date(role.get('start_date'))
                e_date = parse_date(role.get('end_date'))
                if role.get('is_current'): e_date = today
                
                calc_dur = None
                if s_date and e_date:
                    if e_date < s_date or s_date > today:
                        career_impossible_dates = True
                    calc_dur = (e_date.year - s_date.year) * 12 + (e_date.month - s_date.month)
                
                given_dur = role.get('duration_months')
                given_dur = int(given_dur) if given_dur is not None else 0
                
                actual_dur = calc_dur if (calc_dur is not None and calc_dur > 0) else given_dur
                total_career_months += actual_dur
                
                role_size_str = str(role.get('company_size') or '')
                role_size = size_map.get(role_size_str, -1)
                if role_size == 5 and actual_dur > 120:
                    impossible_founding = True
                    
                role_company = str(role.get('company') or '')
                is_svc = any(sc in role_company.lower() for sc in services_companies)
                if is_svc:
                    is_services_any = True
                else:
                    is_services_only = False
                    
                ind = str(role.get('industry') or '').lower()
                is_consulting = 'consulting' in ind or 'services' in ind or 'outsourcing' in ind
                if not is_svc and not is_consulting:
                    product_company_months += actual_dur
                    
                desc = str(role.get('description') or '').lower()
                if any(w in desc for w in ['production', 'deployed', 'prod', 'shipped', 'launched']):
                    has_prod_deployment = True
                    
                tit = str(role.get('title') or '').lower()
                is_ai = any(w in tit or w in desc for w in ['ai', 'ml', 'retrieval', 'search', 'recommendation'])
                if is_ai and s_date:
                    months_ago = (today.year - s_date.year)*12 + (today.month - s_date.month)
                    weight = math.exp(-math.log(2) * (months_ago / 24.0))
                    ai_relevance_score += weight
                    
                if not role.get('is_current'):
                    tenures.append(actual_dur)
                    
                parsed_roles.append({'start': s_date, 'end': e_date, 'dur': actual_dur})
            
            if total_career_months == 0:
                is_services_only = False # Can't be services only if no exp
                
            parsed_roles.sort(key=lambda x: x['start'] if x['start'] else datetime.datetime.min)
            short_tenures_streak = 0
            for i in range(len(parsed_roles)):
                if parsed_roles[i]['dur'] < 18:
                    short_tenures_streak += 1
                else:
                    short_tenures_streak = 0
                if short_tenures_streak >= 2 and len(parsed_roles) >= 3:
                    is_job_hopper = True
                
                if i > 0:
                    prev_end = parsed_roles[i-1]['end']
                    curr_start = parsed_roles[i]['start']
                    if prev_end and curr_start:
                        gap_days = (curr_start - prev_end).days
                        if gap_days > 60:
                            career_gaps_count += 1
                            longest_gap = max(longest_gap, gap_days // 30)
                            
            avg_tenure_months = sum(tenures)/len(tenures) if tenures else 0.0
            
            # Education
            tier_map = {'tier_1':4, 'tier_2':3, 'tier_3':2, 'tier_4':1, 'unknown':0}
            max_tier = 0
            highest_degree = 0 # 5: PhD, 4: Master's, 3: Bachelor's, 2: Diploma, 1: Other
            for ed in education:
                if not ed: continue
                tier_str = str(ed.get('tier') or 'unknown')
                t = tier_map.get(tier_str, 0)
                max_tier = max(max_tier, t)
                deg = str(ed.get('degree') or '').lower()
                d_val = 1
                if 'phd' in deg or 'doctor' in deg: d_val = 5
                elif 'master' in deg or 'ms' in deg or 'mtech' in deg or 'mba' in deg: d_val = 4
                elif 'bachelor' in deg or 'bs' in deg or 'btech' in deg or 'be' in deg: d_val = 3
                elif 'diploma' in deg: d_val = 2
                highest_degree = max(highest_degree, d_val)
                
            # Redrob Signals
            last_active = parse_date(signals.get('last_active_date'))
            days_since_active = (today - last_active).days if last_active else 0
            is_stale = days_since_active > 90
            
            salary = signals.get('expected_salary_range_inr_lpa') or {}
            s_min = salary.get('min')
            s_min = float(s_min) if s_min is not None else 0.0
            s_max = salary.get('max')
            s_max = float(s_max) if s_max is not None else 0.0
            sal_mid = (s_min + s_max) / 2.0
            sal_out_of_range = sal_mid > 60 or (s_min == 0 and s_max == 0)
            
            np_days = signals.get('notice_period_days')
            np_days = int(np_days) if np_days is not None else 0
            notice_too_long = np_days > 60
            
            # Honeypot detection
            curr_title = str(profile.get('current_title') or '').lower()
            title_mismatch = ('senior' in curr_title or 'lead' in curr_title) and yoe < 2
            
            conn_count = signals.get('connection_count')
            conn_count = int(conn_count) if conn_count is not None else 0
            end_recv = signals.get('endorsements_received')
            end_recv = int(end_recv) if end_recv is not None else 0
            end_anom = end_recv > 500 and conn_count < 10
            
            profile_comp = signals.get('profile_completeness_score')
            profile_comp = float(profile_comp) if profile_comp is not None else 0.0
            recruiter_resp = signals.get('recruiter_response_rate')
            recruiter_resp = float(recruiter_resp) if recruiter_resp is not None else 0.0
            interview_comp = signals.get('interview_completion_rate')
            interview_comp = float(interview_comp) if interview_comp is not None else 0.0
            offer_accept = signals.get('offer_acceptance_rate')
            offer_accept = float(offer_accept) if offer_accept is not None else 0.0
            github_score = signals.get('github_activity_score')
            github_score = float(github_score) if github_score is not None else 0.0
            
            perf_sig = (
                profile_comp == 100.0 and
                recruiter_resp == 1.0 and
                interview_comp == 1.0 and
                offer_accept == 1.0 and
                github_score == 100.0
            )
            
            # Lower threshold: advanced OR expert with 0 duration_months used
            expert_0_dur_count = sum(
                1 for sk in skills
                if sk and prof_map.get(str(sk.get('proficiency') or '').lower(), 0) >= 3
                and (sk.get('duration_months') or 0) == 0
            )
            suspicious_skills = expert_0_dur_count >= 4
            
            # Career start date in the future
            has_future_start = any(
                parse_date(r.get('start_date')) is not None and parse_date(r.get('start_date')) > today
                for r in career if r
            )
            
            # Claimed YoE vs actual career months — flag if gap > 3 years
            claimed_months = yoe * 12
            experience_mismatch = (
                total_career_months > 0 and
                abs(claimed_months - total_career_months) > 36
            )
            
            is_honeypot = (
                impossible_founding or
                has_future_start or
                suspicious_skills or
                title_mismatch or
                end_anom or
                perf_sig or
                career_impossible_dates or
                experience_mismatch
            )
            
            # Features
            def calc_skill_score(skill_set):
                score = 0
                for sk in skill_set:
                    if sk in cand_skills:
                        p, d, e = cand_skills[sk]
                        score += p * math.log1p(d + 1) * math.log1p(e + 1)
                return score
            
            core_score = calc_skill_score(core_skills)
            strong_score = calc_skill_score(strong_skills)
            adj_score = calc_skill_score(adjacent_skills)
            core_skills_count = sum(1 for sk in cand_skills if sk in core_skills)
            
            skill_assessments = signals.get('skill_assessment_scores') or {}
            bonus = 0.0
            for sk, sc in skill_assessments.items():
                nsk = normalize_skill(sk)
                if nsk in core_skills and sc > 70:
                    bonus += sc / 100.0
            bonus = min(1.0, bonus)
                    
            prod_ratio = product_company_months / total_career_months if total_career_months > 0 else 0.0
            
            sen_match = 1.0 if 5 <= yoe <= 9 else 0.0
            if yoe < 2 or yoe > 15: sen_match = 0.0
            elif 2 <= yoe < 5: sen_match = (yoe - 2)/3.0
            elif 9 < yoe <= 15: sen_match = 1.0 - (yoe - 9)/6.0
            
            avg_ten_capped = min(avg_tenure_months, 36)
            avg_tenure_score = avg_ten_capped / 36.0
            
            # Engagement components
            app_sub = signals.get('applications_submitted_30d')
            app_sub = int(app_sub) if app_sub is not None else 0
            prof_views = signals.get('profile_views_received_30d')
            prof_views = int(prof_views) if prof_views is not None else 0
            saved = signals.get('saved_by_recruiters_30d')
            saved = int(saved) if saved is not None else 0
            searches = signals.get('search_appearance_30d')
            searches = int(searches) if searches is not None else 0
            
            verified_email = bool(signals.get('verified_email') or False)
            verified_phone = bool(signals.get('verified_phone') or False)
            linkedin_connected = bool(signals.get('linkedin_connected') or False)
            plat_trust = (int(verified_email) + int(verified_phone) + int(linkedin_connected)) / 3.0
            
            if is_pref_loc:
                loc_score = 1.0
            elif will_relocate and country in ['india', 'in']:
                loc_score = 0.5
            else:
                loc_score = 0.2
            
            notice_score = 1.0 if np_days <= 30 else (1.0 - 0.7 * ((np_days - 30)/60.0) if np_days <= 90 else (0.3 - 0.3 * ((np_days - 90)/90.0) if np_days <= 180 else 0.0))
            notice_score = max(0.0, notice_score)
            
            sal_fit = 1.0 if 20 <= sal_mid <= 50 else (0.5 if 50 < sal_mid <= 70 else 0.0)
            
            # Row data
            feat = {
                'candidate_id': c_id,
                'core_skill_score_raw': core_score,
                'strong_skill_score_raw': strong_score,
                'adjacent_skill_score_raw': adj_score,
                'skill_assessment_bonus': bonus,
                'product_company_ratio': prod_ratio,
                'ai_ml_relevance_score': ai_relevance_score,
                'seniority_match': sen_match,
                'avg_tenure_score': avg_tenure_score,
                'has_production_deployment': has_prod_deployment,
                'is_stale': is_stale,
                'open_to_work_flag': bool(signals.get('open_to_work_flag') or False),
                'recruiter_response_rate': recruiter_resp,
                'interview_completion_rate': interview_comp,
                'app_sub': app_sub,
                'prof_views': prof_views,
                'saved': saved,
                'searches': searches,
                'platform_trust_score': plat_trust,
                'location_score': loc_score,
                'notice_score': notice_score,
                'salary_fit': sal_fit,
                'is_honeypot_suspect': is_honeypot,
                'is_job_hopper': is_job_hopper,
                'is_services_only': is_services_only,
                'is_purely_non_nlp': is_purely_non_nlp,
                'is_stale_profile': is_stale,
                'years_of_experience': yoe,
                'current_company_size_numeric': float(curr_size)
            }
            features_list.append(feat)
            
            meta = {
                'candidate_id': c_id,
                'current_title': str(profile.get('current_title') or ''),
                'years_of_experience': yoe,
                'location': str(profile.get('location') or ''),
                'country': str(profile.get('country') or ''),
                'headline': str(profile.get('headline') or ''),
                'is_honeypot_suspect': is_honeypot,
                'is_job_hopper': is_job_hopper,
                'is_services_only': is_services_only,
                'is_stale_profile': is_stale,
                'recruiter_response_rate': recruiter_resp,
                'notice_period_days': np_days,
                'core_skills_count': int(core_skills_count)
            }
            metadata_list.append(meta)
            
    # Post processing / Normalizations
    print("Normalizing features...")
    df_feat = pd.DataFrame(features_list)
    df_meta = pd.DataFrame(metadata_list)
    
    # Normalize skill scores [0, 1]
    if not df_feat.empty:
        for col in ['core_skill_score_raw', 'strong_skill_score_raw', 'adjacent_skill_score_raw']:
            max_val = df_feat[col].max()
            if max_val > 0:
                df_feat[col.replace('_raw', '')] = df_feat[col] / max_val
            else:
                df_feat[col.replace('_raw', '')] = 0.0
            df_feat.drop(columns=[col], inplace=True)
    else:
        for col in ['core_skill_score_raw', 'strong_skill_score_raw', 'adjacent_skill_score_raw']:
            df_feat[col.replace('_raw', '')] = pd.Series(dtype='float32')
            df_feat.drop(columns=[col], inplace=True)
        
    # Availability Score
    df_feat['availability_score'] = (
        0.4 * (~df_feat['is_stale']).astype(float) +
        0.2 * df_feat['open_to_work_flag'].astype(float) +
        0.2 * df_feat['recruiter_response_rate'] +
        0.2 * df_feat['interview_completion_rate']
    )
    df_feat.drop(columns=['is_stale', 'open_to_work_flag', 'recruiter_response_rate', 'interview_completion_rate'], inplace=True)
    
    # Engagement Score
    for col in ['app_sub', 'prof_views', 'saved', 'searches']:
        p95 = df_feat[col].quantile(0.95)
        if p95 > 0:
            df_feat[col] = df_feat[col].clip(upper=p95) / p95
        else:
            df_feat[col] = 0.0
            
    df_feat['engagement_score'] = (
        0.2 * df_feat['app_sub'] +
        0.2 * df_feat['prof_views'] +
        0.3 * df_feat['saved'] +
        0.3 * df_feat['searches']
    )
    df_feat.drop(columns=['app_sub', 'prof_views', 'saved', 'searches'], inplace=True)
    
    df_feat['ai_ml_relevance_score'] = df_feat['ai_ml_relevance_score'].clip(0.0, 1.0)
    
    # Fill NaNs with 0/False, cast floats to float32
    df_feat = df_feat.fillna(0.0)
    for col in df_feat.select_dtypes(include=['float64']).columns:
        df_feat[col] = df_feat[col].astype('float32')
        
    # Output
    print("Saving parquets...")
    os.makedirs(os.path.dirname(os.path.abspath(features_out)), exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(metadata_out)), exist_ok=True)
    df_feat.to_parquet(features_out, engine='fastparquet', index=False)
    df_meta.to_parquet(metadata_out, engine='fastparquet', index=False)
    
    # Report / Summary
    print("\n--- Summary ---")
    print(f"Total records processed: {total_records}")
    print(f"Missing Certifications: {missing_certs/total_records:.1%}")
    print(f"Missing Languages: {missing_langs/total_records:.1%}")
    print(f"Missing Education Grade: {missing_grades/total_records:.1%}")
    print(f"Missing GitHub Activity: {missing_github/total_records:.1%}")
    
    print(f"\nFeatures shape: {df_feat.shape}")
    print(f"Honeypots: {df_feat['is_honeypot_suspect'].mean():.2%}")
    print(f"Job Hoppers: {df_feat['is_job_hopper'].mean():.2%}")
    print(f"Services Only: {df_feat['is_services_only'].mean():.2%}")
    print(f"Stale Profiles: {df_feat['is_stale_profile'].mean():.2%}")
    
    print("\nMetrics (Min / Max / Mean):")
    print(f"core_skill_score: {df_feat['core_skill_score'].min():.3f} / {df_feat['core_skill_score'].max():.3f} / {df_feat['core_skill_score'].mean():.3f}")
    print(f"availability_score: {df_feat['availability_score'].min():.3f} / {df_feat['availability_score'].max():.3f} / {df_feat['availability_score'].mean():.3f}")
    print(f"seniority_match: {df_feat['seniority_match'].min():.3f} / {df_feat['seniority_match'].max():.3f} / {df_feat['seniority_match'].mean():.3f}")
    
    top_titles = df_meta['current_title'].value_counts().head(10)
    print("\nTop 10 Current Titles:")
    for title, count in top_titles.items():
        print(f"  {title}: {count}")
        
    top_skills = all_skills.most_common(50)
    print(f"\nTop 5 Skills (out of {len(all_skills)} unique normalized skills):")
    for sk, c in top_skills[:5]:
        print(f"  {sk}: {c}")

    end_time = datetime.datetime.now()
    print(f"\nCompleted in {(end_time - start_time).total_seconds():.1f} seconds.")

def main():
    run_preprocessing('candidates.jsonl')

if __name__ == '__main__':
    main()
