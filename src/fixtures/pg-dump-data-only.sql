--
-- PostgreSQL database dump
--

\restrict 1KDMBBzpkTxilpVcXKnPWacRJXnrON3chrvxm2GZSPlLe4dF58ihEnSBrVTz3xh

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('69920da8-63be-41fa-a764-af28f462280c', 'a8802e85d6107e7948851ee02a1d4943413c7c8ccd8cf2ac568c9b82f4ac868b', '2026-09-28 09:20:29.689782+00', '20260829213000_add_ai_engine', NULL, NULL, '2026-09-28 09:20:29.68922+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('dd8f6cc0-652c-46a1-ba30-c93d843db692', '743b0220328b0c568b49d20b651cd4aa623040e7d350571ed43d5de3c5977405', '2026-09-28 09:20:29.670056+00', '20260427043433_baseline_phase2', NULL, NULL, '2026-09-28 09:20:29.66334+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('304af8f2-1b19-4e86-85ea-63c4a455e3d8', '8f526e356ef91d20fedd06b261b82c2b5d4d4c08b2a8237b9e006f9788f9c733', '2026-09-28 09:20:29.680449+00', '20260827111637_add_workingnomads_himalayas', NULL, NULL, '2026-09-28 09:20:29.68001+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('515fbf1b-5f05-4995-a704-e1bbc9bb67da', '5a107a90f8b608c644135b345ae854ee1800c51bea29dc617e64a0601046001b', '2026-09-28 09:20:29.670875+00', '20260427043733_add_aggregator_ats', NULL, NULL, '2026-09-28 09:20:29.670267+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7463b79e-84b1-48d1-9997-06cec0d54cd7', 'da0a831059d0154db554140cf6c79772da498211a7b2c68c5f6dda4288d3bdee', '2026-09-28 09:20:29.671883+00', '20260427044216_add_classifier_mode', NULL, NULL, '2026-09-28 09:20:29.671058+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('c9f7185e-b95d-4997-9665-3046f1d39823', 'fddd5a6d0fed40b6b84e56d836b2e7fbc3b5545c7ce6a0d695c420c7f94e8cbb', '2026-09-28 09:20:29.673117+00', '20260427045438_add_application_tracking', NULL, NULL, '2026-09-28 09:20:29.672055+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('dd155fde-036b-4cb1-87c9-f1b0586f252c', '5a7f4fdfabde4c32a028814a286eae88f3b9bdb339c3f201aaf46bb7ff9fabac', '2026-09-28 09:20:29.68106+00', '20260827122249_add_fetching_enabled', NULL, NULL, '2026-09-28 09:20:29.680597+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d48f0b3d-e5ff-48eb-af9f-3c461ae8284d', 'e3b54d820a08672e71a36bcbab637304b84e380a955a174d2105de52abd330fe', '2026-09-28 09:20:29.673756+00', '20260427050442_add_hn_parser', NULL, NULL, '2026-09-28 09:20:29.673268+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('54932cf7-2524-4cbb-a150-a39ebed9f19a', 'fbd2ad95a6e2b67513c470b65316fb5f8aac3ae91a7d3572f60e020403388038', '2026-09-28 09:20:29.674388+00', '20260427163739_add_disabled_sources', NULL, NULL, '2026-09-28 09:20:29.673906+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('41bcc2ba-0df2-4d1d-9770-6c366cd61c3a', '26b5c21f0d9dc67358c21f1ac002894ef50c64132a1c8087cf7f97251a43f84f', '2026-09-28 09:20:29.695024+00', '20260831154000_add_rippling', NULL, NULL, '2026-09-28 09:20:29.69463+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9cccc41c-aa7d-4f37-a19f-c2184429a71b', '6f4eceb5f8a96202d7a0bff05b9889a47d9ae7a70c154f2a04fe667da4694c3d', '2026-09-28 09:20:29.676144+00', '20260427164226_add_discovery', NULL, NULL, '2026-09-28 09:20:29.674541+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9e52f27d-78c7-44b0-896e-d637feb7f5e1', 'f3aa7b4b4009cc9e7d6169c2e65888e19d3937af5e300d82abbb4160b72ae36a', '2026-09-28 09:20:29.683814+00', '20260828001131_add_resumes', NULL, NULL, '2026-09-28 09:20:29.681213+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('095f32a2-5a04-433c-96fb-263a19d882cf', '4a8d647fc0d89951af56e14124020f315129a538b866eb0ffaaf590bc5bdfe45', '2026-09-28 09:20:29.676808+00', '20260427174126_add_role_types', NULL, NULL, '2026-09-28 09:20:29.676306+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('a00cdcbb-fef2-4244-951f-2abfddff6f3e', '85ba6143c7ff0cee0777bf2bfc47c0bb09e6e2b044183c29c64c6c07ee160271', '2026-09-28 09:20:29.677389+00', '20260427175125_add_workable_smartrecruiters', NULL, NULL, '2026-09-28 09:20:29.67696+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('cc850bed-ed73-49d5-8055-b25634283e3e', '6251b680f16fb7a8c7f91445b6b38e67967a8de688c525cb2479e20c7fb1f547', '2026-09-28 09:20:29.690538+00', '20260830120000_add_ai_engine_chain', NULL, NULL, '2026-09-28 09:20:29.689928+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('83478ba4-3527-4fe7-9a68-99576a31edab', 'ef0d6eb451e31c883de53827b141eb0f9245d283d2161bbae2e9b75990da03fe', '2026-09-28 09:20:29.678071+00', '20260427175829_add_wwr_golangprojects', NULL, NULL, '2026-09-28 09:20:29.67753+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2db5d3f3-46b5-44e0-a1a6-e626008f60cb', '5fce5c53fc9046c3727f23e20573400bf85e391ccddcf7ad235286e74508de53', '2026-09-28 09:20:29.685656+00', '20260828005706_add_manual_jobs_verification', NULL, NULL, '2026-09-28 09:20:29.683962+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('13611e1a-a522-4141-bfa4-e247f47ab3d2', 'cd648e7af56958a346aee83570228f3c85fcefb1cfda9660bef514ab04a89ecb', '2026-09-28 09:20:29.678719+00', '20260427193140_add_priority_rules', NULL, NULL, '2026-09-28 09:20:29.678214+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f5244bd9-bc1c-41aa-81cc-79a378696b8d', 'f7e5863f7d96a5a8e605a171481723bddd0afa183b1ef22b1093cc514f095ebb', '2026-09-28 09:20:29.679275+00', '20260429203142_add_jobicy', NULL, NULL, '2026-09-28 09:20:29.678862+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ce270681-f8df-4c33-a420-4f2b9d110acf', '5e796fb17eb9519c14ec98301ec2f045b4bd6c41b24993893a70f638083b0424', '2026-09-28 09:20:29.67983+00', '20260429220551_add_hn_jobs', NULL, NULL, '2026-09-28 09:20:29.679413+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d214f596-c0b0-4ab8-9081-dce476953c59', '8b15cfe1140e4424d970266dfb86cb33b0f96dafd7a825bce4840dd5bdd19ebd', '2026-09-28 09:20:29.686442+00', '20260828143057_add_match_snapshot', NULL, NULL, '2026-09-28 09:20:29.685802+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('485a3880-cd2a-48b7-acc8-ea2fd47a5263', '5fe8e45c5fe1999ce56507877f2d2efb1c335e46149e411f1b1536597f43a835', '2026-09-28 09:20:29.693416+00', '20260831151000_add_breezy', NULL, NULL, '2026-09-28 09:20:29.692995+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('74bd7d96-fff7-4662-af95-6c446404d800', 'a45585dbe061e004e4908c79d905d1c9f885776cf31b5ff23ae672840f73d93d', '2026-09-28 09:20:29.687036+00', '20260828204953_add_resume_hidden', NULL, NULL, '2026-09-28 09:20:29.686582+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d71086cd-3507-4803-acf7-4ca85921e829', 'e99dbc7c14adc51c1873b1da9cefc82d014af429c1e69551dad9d43f9688607c', '2026-09-28 09:20:29.691095+00', '20260830160000_add_ai_usage', NULL, NULL, '2026-09-28 09:20:29.690685+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f13c7384-4099-455e-8c18-f9f680740126', 'dad49e5e1f451c7543005a4e2d2d317c7704953e6b7b7df389aaa48e5c4e6e10', '2026-09-28 09:20:29.688451+00', '20260828230000_add_match_breakdown_and_candidate_facts', NULL, NULL, '2026-09-28 09:20:29.687188+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('90da6e7a-19d1-41fe-bf47-78ea48ccb302', '1e298abc782d18fef86731bc62579e1122b6379204abf1464e9d6a2160b6d839', '2026-09-28 09:20:29.689078+00', '20260829031500_add_match_cautions', NULL, NULL, '2026-09-28 09:20:29.688599+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('a8d40676-c011-4720-ad00-aa70d0b859d7', '928406f9a8914b37cff3d40e5263992a7e42fb03e890e5fc67991e3a0e8c7ac5', '2026-09-28 09:20:29.691693+00', '20260831120000_add_resume_primary_skills', NULL, NULL, '2026-09-28 09:20:29.691235+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b6869b4b-3a48-4047-82de-049ff3334e04', 'eb0ebc2544bc102e68bb08e5605adaddf46640dd2c98d480336c192315d7188c', '2026-09-28 09:20:29.693947+00', '20260831152000_add_bamboohr', NULL, NULL, '2026-09-28 09:20:29.693555+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('efef86a4-7728-421a-af36-0dae4023239d', 'eb8429d966cd47f4109c0fa1071cb378e292e327a8c33817a5b2bd2689668ac4', '2026-09-28 09:20:29.692272+00', '20260831130000_add_job_liveness', NULL, NULL, '2026-09-28 09:20:29.691831+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('79c64557-4069-405e-a8bf-5f4263386fe3', '850401e6732e6194b047de79e6b843d9c57b1731085d10c10904aa98abfb31f5', '2026-09-28 09:20:29.692839+00', '20260831150000_add_recruitee', NULL, NULL, '2026-09-28 09:20:29.69241+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e9b93476-72e0-43ca-8186-820b887f32cd', '78031ed5bd6ce03952e5b3f90feb2e743363598c3939d5ea72bdae20a1d9a477', '2026-09-28 09:20:29.699251+00', '20260831180000_add_cover_letter', NULL, NULL, '2026-09-28 09:20:29.697508+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6b57a0cd-e88c-49c3-bd72-bd786ef024b9', '9e21b95c8e26a45ed0a1278432527c529d9541bc2bb99957d87d957b55224fea', '2026-09-28 09:20:29.694492+00', '20260831153000_add_pinpoint', NULL, NULL, '2026-09-28 09:20:29.694085+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5f0b0b66-e98c-42f5-a42d-2f508d99e500', '4d546659fe47cb28d0846ad6640c4b154e3110a2129605b46b3e11a84f556ccb', '2026-09-28 09:20:29.697356+00', '20260831170000_add_source_health', NULL, NULL, '2026-09-28 09:20:29.696837+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2761dfdc-8292-43a4-bb5a-0278c35ecc01', 'e6fb1447100c85787d03bc96d16be5f92613d31cddafba5e8800d324da276ea4', '2026-09-28 09:20:29.695563+00', '20260831155000_add_fourdayweek', NULL, NULL, '2026-09-28 09:20:29.695178+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ef3abc56-fd36-4d25-9c24-b22522515c26', 'cd620ac219fb64e1930e3aad19e5a1d035067f9461d64db89939a6ef78791144', '2026-09-28 09:20:29.696693+00', '20260831160000_add_simhash_dedup', NULL, NULL, '2026-09-28 09:20:29.695711+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3bd4c773-e2a1-488b-8f09-3663ec52d1c0', '4eeeaa56c1b7970ad26d171b43e139051bb307fd229616cdb90dc7a3a9fc542f', '2026-09-28 09:20:29.699827+00', '20260831190000_add_cover_angles', NULL, NULL, '2026-09-28 09:20:29.699397+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('831d76d2-315c-4071-9f30-af069051cc04', 'b930670b993f827845ac91753cef155c36209d2390494e4a1f5f3a6073f97083', '2026-09-28 09:20:29.701451+00', '20260901040000_add_stage_events', NULL, NULL, '2026-09-28 09:20:29.699975+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ffcd980d-aca1-4717-9406-91af6fe89b5e', '121f9c927cccd706db589b24df6531c389c67b6d19c4ddbab0f52a139decfc8a', '2026-09-28 09:20:29.702076+00', '20260901130000_add_pipeline_stages', NULL, NULL, '2026-09-28 09:20:29.701602+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('0eeeb500-0b26-4353-9eef-0226e5899d7d', 'acc7100c9b89034721d3662d8b0f7be7c7e17786334e5156e71175d9b56ebdf4', '2026-09-28 09:20:29.703552+00', '20260901175000_normalize_table_names', NULL, NULL, '2026-09-28 09:20:29.702249+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('eca24d60-ab54-4346-b415-4c9d07892686', '179b4254eba5bf79c3b55f3abb7e55f149c2c8197000063ba1ce1b0b9d260b25', '2026-09-28 09:20:29.704227+00', '20260901190000_rename_sequences', NULL, NULL, '2026-09-28 09:20:29.703702+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('a6ebd72c-8a45-4654-ac00-0e8f951c7387', '58e57bd22ab1d6f598e468e5374fe404f37eafe90e311fd94648993c9e629b5f', '2026-09-28 09:20:29.727788+00', '20260905160000_notification_targets', NULL, NULL, '2026-09-28 09:20:29.726528+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8faf734c-871e-4d07-b66d-bdc93b63e5fd', '36bdea02079c0ff9e6efd4ca1fec976e4d560a7de08d33ae4abec94f0a42b072', '2026-09-28 09:20:29.704935+00', '20260901220000_add_setup_completed_at', NULL, NULL, '2026-09-28 09:20:29.704372+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('890fed77-5f89-41d6-8352-e64344729374', 'b32f5346e1dcf075c091727ee62259cbd8c6baa2d7cef88729f5e13fd7995bb6', '2026-09-28 09:20:29.717265+00', '20260903230000_add_landingjobs', NULL, NULL, '2026-09-28 09:20:29.71686+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('452e7b89-6257-4dee-9d33-55f95dc9e392', '7f0e54b4c11bd788dd9a75c9d37dd1f27148dc31224dcf420c0cc2252782c1fa', '2026-09-28 09:20:29.705499+00', '20260902090000_add_ai_keys', NULL, NULL, '2026-09-28 09:20:29.705077+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('760fda68-3f5b-46db-8ae8-c6abb08d6d73', '3b7b400a53229cf971bb661ea167d58decf113c9bfee06e7c101a6a3219cdc61', '2026-09-28 09:20:29.706411+00', '20260902120000_add_profile_resume', NULL, NULL, '2026-09-28 09:20:29.705642+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('dcc37833-e49f-49ce-9213-9c6c67eeac27', '00da2061720130a5d278b093bea5c8168a33b51f9721720c770946a73aa52d4e', '2026-09-28 09:20:29.723435+00', '20260904050000_add_instance_id', NULL, NULL, '2026-09-28 09:20:29.722025+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('401f4d83-cabc-49b4-b010-684b42fd5ace', 'e67c625ef9d5bc32dc9e551f0d601097be91c914af358244afda2c02fd51048f', '2026-09-28 09:20:29.708789+00', '20260902140000_add_job_score_and_active_profiles', NULL, NULL, '2026-09-28 09:20:29.706571+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2056e057-bea8-41c7-b137-1f43cdbc8c71', '72eef6cd61a657249111c2e124240bfc85397a8f7f2743718e859cbbadb288e4', '2026-09-28 09:20:29.71779+00', '20260903233000_add_jobtech', NULL, NULL, '2026-09-28 09:20:29.717405+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f44acc78-411e-432a-962e-b82b980b35ba', '50abf06b3c82c07947039f7bbd4b90840a9b0ad76bb06723fad96fd78f8829d1', '2026-09-28 09:20:29.709741+00', '20260902160000_add_applied_resume', NULL, NULL, '2026-09-28 09:20:29.708938+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9b614202-d9e3-4200-b2ea-3ea4c65315a3', 'bcb4342965bf5ebacc1efb1f5ce8f9629133946fa47930398bb0ea33938423d4', '2026-09-28 09:20:29.711449+00', '20260902180000_add_resume_review', NULL, NULL, '2026-09-28 09:20:29.709886+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9eea7713-a6cc-41e2-94d6-5debf19f3fdc', '5f4795423a3ab532b8e81ad55990c9baf9ba0b82dde9a0732d77b1fc67973600', '2026-09-28 09:20:29.712037+00', '20260902200000_add_resume_answers', NULL, NULL, '2026-09-28 09:20:29.711595+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6c986534-cc74-41ab-8087-db5ba1e7d3be', '2c287205764c337654c0dd50d3d39285ce2a125ed4326d24d913069e3f16904c', '2026-09-28 09:20:29.718326+00', '20260903234500_add_personio', NULL, NULL, '2026-09-28 09:20:29.717927+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d5c901ec-9f2b-40d2-8b76-7e9da7fc1a71', '60ba3ed520391d776a06e02044a07c2f0a6f0d78fe307007eff07312853c43f6', '2026-09-28 09:20:29.713369+00', '20260903120000_add_job_location_fields', NULL, NULL, '2026-09-28 09:20:29.712181+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8f808d5c-d01c-4034-9194-57ba1b866b2b', 'ef78f3be7645c39b17fe7c2364454411b6f42182ca48461db62b9b71050932d8', '2026-09-28 09:20:29.714516+00', '20260903170000_add_profile_countries', NULL, NULL, '2026-09-28 09:20:29.713524+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('03058588-c8b3-4b3f-bf2e-64cff28f0d6d', 'f936c186bd9c661a7169cef97229594b86b227c00f4908c6fbced0340c607089', '2026-09-28 09:20:29.715065+00', '20260903190000_add_dou', NULL, NULL, '2026-09-28 09:20:29.714651+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5ea44fb4-6c5e-4845-b8eb-80ed13493779', '34cbbf560027c5812b08fff695536b4ae9d05d889d4334931d4c88bd3def7dcf', '2026-09-28 09:20:29.718871+00', '20260903235500_add_teamtailor', NULL, NULL, '2026-09-28 09:20:29.718468+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('a0aa2989-5afc-445c-8cf5-8134805d67f6', '1842ff17802a260e88e8612d3c205ce912e628945712b970862712e8cc991087', '2026-09-28 09:20:29.715615+00', '20260903200000_add_djinni', NULL, NULL, '2026-09-28 09:20:29.715208+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('207cf4ad-585d-449a-bea2-948211958e07', 'bd1e436dbd454522a6739360862c18d3c523662259713ca056220f79369b1a25', '2026-09-28 09:20:29.716152+00', '20260903210000_add_solidjobs', NULL, NULL, '2026-09-28 09:20:29.715762+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3838e16a-5ba4-46a6-9c42-8d13ca128c2e', 'cff73cb3aa2333aa64c1c6d687928731202da4fddb675c87f6bab27ef5a8afe2', '2026-09-28 09:20:29.724214+00', '20260904060000_add_schedule', NULL, NULL, '2026-09-28 09:20:29.723585+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('635ee578-f3c8-4014-9472-5608c1e21b48', '60a82ddd39312383cd1c12ba25ca87c88065dcb05e0f62d3f1036c6ff79c81d0', '2026-09-28 09:20:29.716725+00', '20260903220000_add_devitjobs', NULL, NULL, '2026-09-28 09:20:29.71629+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('68baf6f7-50d8-4087-9cab-4d08694970e6', '0e76f93442ddb74ca05cf5506236d98a35a7cd15b587f9a45a7ccad39af629fe', '2026-09-28 09:20:29.719624+00', '20260904000000_add_profile_eligibility', NULL, NULL, '2026-09-28 09:20:29.719008+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('fe5e51bd-834e-48a0-bbc9-d25b4f345f05', 'f213d4a4037cb7a3e9becaeb06c744937583fe83a119d8de14766c1ee6d6e070', '2026-09-28 09:20:29.720212+00', '20260904010000_add_salary_currency', NULL, NULL, '2026-09-28 09:20:29.719765+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2b0f33c1-2ba5-4bf8-8a92-b56d4273fbc2', '77791ee5d635b79508ce6329bcae7c6ea1d7ff43ab9261a55cfd7095684f3834', '2026-09-28 09:20:29.737502+00', '20260909180000_screening_comparison', NULL, NULL, '2026-09-28 09:20:29.736091+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5eaedc9a-68b7-4d5a-8f65-4fa2440d9991', '149b6eb32d69f7360398e2d23f5bb29e605d460d254ac3d737f27accc8f6d586', '2026-09-28 09:20:29.720749+00', '20260904020000_add_source_keys', NULL, NULL, '2026-09-28 09:20:29.720349+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('da7d5783-3d6d-4d9d-a0d1-ae2c72f86fe5', 'b7dc5ec6bac1225658b7d196f1ecb5e8b7afe099f52e238048633a97ae0defab', '2026-09-28 09:20:29.725215+00', '20260904070000_add_company_watchlist', NULL, NULL, '2026-09-28 09:20:29.724363+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('fa3fb795-a382-4667-8ad9-9f313006453c', 'd018e4c2823ffe90f6751d07322c73bf6fbaeff4685fa1b918728079f0bba040', '2026-09-28 09:20:29.721283+00', '20260904030000_add_adzuna', NULL, NULL, '2026-09-28 09:20:29.720887+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('16790dc4-3668-46c6-bcbd-4a4c41218a7e', 'ebb119705a446d8017c3714a119f3d467277c34f47f9ba9d908e034f01149064', '2026-09-28 09:20:29.721885+00', '20260904040000_add_france_travail', NULL, NULL, '2026-09-28 09:20:29.721424+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8f1308e5-10e4-4799-96cb-7922e75cc4b5', 'b645fa33fe76f0f43d86f099936d99d377d64a6222ffbbc876c07c3889c3ffc1', '2026-09-28 09:20:29.728422+00', '20260905210000_posting_refresh', NULL, NULL, '2026-09-28 09:20:29.727943+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('117d13eb-bf5f-4bce-9bbf-c4708a1a3c44', '27fbc8ba8407e022c2a5afb59465e6fc1b340b8d47c3894f8a1dc8e6e70e525d', '2026-09-28 09:20:29.725803+00', '20260904080000_add_change_watch', NULL, NULL, '2026-09-28 09:20:29.725358+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5e461bef-daf7-4355-a6c1-a1e7aec9d9da', '44da45de89fed4fcb97af544ff3f8285b3a217a96e4336423b67bc356a01222b', '2026-09-28 09:20:29.726382+00', '20260904090000_add_resume_structure', NULL, NULL, '2026-09-28 09:20:29.725948+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('95240e3a-8001-42b7-8021-ee3e2d2e7ca1', '323ee75c2229d923f0c87488e55bb789090081985c768183b55126f4a03f9542', '2026-09-28 09:20:29.734434+00', '20260909090000_screening', NULL, NULL, '2026-09-28 09:20:29.730839+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8b90083f-ea16-4f6c-9754-0779a83f9f33', '5e1f1cb125cf9433c6d9386b70880b71c9afa50cc163ab59a38de8ca0a087240', '2026-09-28 09:20:29.730087+00', '20260906120000_posting_brief', NULL, NULL, '2026-09-28 09:20:29.728571+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('48830075-eb0a-46ce-8ec2-4e5630819efe', '6a3fe961b455c79fd09e0d9065964571257f73924b7c4e45f64d0de5c7e843df', '2026-09-28 09:20:29.735944+00', '20260909150000_screening_posting_text', NULL, NULL, '2026-09-28 09:20:29.735356+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4ab5e6a2-ff3b-4971-b09a-bce23f5b33d7', '9ebc5314d96bb85ad1a0589bd5871fe3f4e5d4c44ec4f530b515384aa336f21c', '2026-09-28 09:20:29.730682+00', '20260908183000_resume_industries', NULL, NULL, '2026-09-28 09:20:29.730228+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f43e2f8c-8078-48c7-99f8-3137a032d564', 'cddd1d88e03bb5d691c282d68fac33c100f2f84bcd6128f12a047e947bb608fc', '2026-09-28 09:20:29.735213+00', '20260909120000_screening_versions_and_adjustment', NULL, NULL, '2026-09-28 09:20:29.73458+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e7bfbf8a-02a7-4545-81f8-225c9e6417b6', '1548210a0bcc88c9cd4db530e70ee15fda154df88aee245011438657b4a48434', '2026-09-28 09:20:29.739332+00', '20260910130000_fk_indexes_and_unique_destinations', NULL, NULL, '2026-09-28 09:20:29.737652+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('11ba6531-66f1-4661-9684-1c6e6b1632c3', '336adbc53fa6b01c9e97fd28796f2e3a48d026da5481c9f1c10c04f822855ea6', '2026-09-28 09:20:29.740085+00', '20260913170000_match_resume_name', NULL, NULL, '2026-09-28 09:20:29.739482+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d10791d7-0a5c-48a3-a07d-f15055be24fa', 'd115698f25301c9cc85d9807a642ca366a8cbfc10ecd432d37bfd774fa8737d1', '2026-09-28 09:20:29.741127+00', '20260920120000_posting_brief_unique', NULL, NULL, '2026-09-28 09:20:29.740234+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d6ab14a8-2ce1-4f3a-955c-57202c316ed3', '2cdda5bb93b0ba031f25a4d6cc31dac59952458e807089814a65fa8a5e90ffd3', '2026-09-28 09:20:29.741716+00', '20260925120000_page_change_pending', NULL, NULL, '2026-09-28 09:20:29.741273+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('100c82b6-e01e-4160-8b06-6d66b2122d68', '01bdedec1acc1e4fd26ed5a360eb8b49011a658163b09396b7ca5bc3df9bc19a', '2026-09-28 09:20:29.743366+00', '20260928120000_funnel_day', NULL, NULL, '2026-09-28 09:20:29.741874+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('4aafb6f6-ea5d-4ce9-8be0-c406a8f79260', '3b6441843fcde649fa4f70d09933b6e36ffeabcc34b95cd8e8d86cd34d63d716', '2026-09-28 09:20:29.745071+00', '20260928160000_ai_call', NULL, NULL, '2026-09-28 09:20:29.743513+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b9ec2f2f-341a-4e90-b2b4-d86e862f755a', '30a5a8f9596a9569c5f85cfd0799f2e3f1f23212c30d80b5dcd3973c3c6faad7', '2026-09-28 09:20:29.745704+00', '20260928180000_update_check', NULL, NULL, '2026-09-28 09:20:29.745212+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('19171901-5af8-4422-9595-7e53dbe1afbc', '96e2f56635edae9f36f22fed545de0dc6fd96158386d9e64c72a33a9da46b093', '2026-09-28 09:20:29.746986+00', '20260928200000_company_mute', NULL, NULL, '2026-09-28 09:20:29.745851+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9ae8abba-bf64-46bc-b674-66fed0439080', 'def2b7c44908ebfc1760883a7b10b227db9fa31693771f42d8f770998375927c', '2026-09-28 09:20:29.747747+00', '20260928210000_browser_page', NULL, NULL, '2026-09-28 09:20:29.747125+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3365a440-8172-4898-b9cb-d54d952c8e79', '9d959569d5932cd93d67cdb4dc05cdc7382959aaa5e887ce285cba32af9cac7c', '2026-09-28 09:20:29.7483+00', '20260928220000_crawl_delay', NULL, NULL, '2026-09-28 09:20:29.747887+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3a97751d-dd60-4e80-95af-ca6119fc2829', '8439446ee3d2180a4319fa3f7070f7800ed44a5f10898d18e251a378906d2c88', '2026-09-28 09:20:29.748849+00', '20260928230000_company_validator', NULL, NULL, '2026-09-28 09:20:29.748447+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('feecc740-b38e-437f-a4e5-df72679e3b16', 'a07a9b848f3406e1207eaa86b334cba25faf8eeb73e4538ca34378d5b41db14c', '2026-09-28 09:20:29.749421+00', '20260929000000_openai_base_url', NULL, NULL, '2026-09-28 09:20:29.748992+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b79893a5-620f-4851-a440-3e68d6e14488', '6594795cbdd102704e6a9dd2d1eae333502467b877ce204e57d15f119cf85891', '2026-09-28 09:20:29.750005+00', '20260929010000_local_api', NULL, NULL, '2026-09-28 09:20:29.749561+00', 1);


--
-- Data for Name: ai_call; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: notification_target; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: resume; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.app_settings (id, "telegramEnabled", "activeProfileId", "updatedAt", "classifierMode", "applicationTrackingEnabled", "staleApplicationsDigestEnabled", "hnParserEnabled", "disabledSources", "discoveryEnabled", "fetchingEnabled", "aiEngine", "aiUsage", "sourceHealthAlerts", "coverAngles", "pipelineStages", "setupCompletedAt", "aiKeys", "sourceKeys", "instanceId", schedule, "employerMode", "screeningRetentionDays", "aiBudgetAlerted", "aiBudgetCents", "latestCheckedAt", "latestVersion", "updateCheck", "employersFilledAt", "reapplyDays", "openAiBaseUrl", "localAiUrl", "localContextTokens") VALUES (1, false, NULL, '2026-09-28 09:20:51.004', 'single', true, true, false, '{}', false, false, '{"order": ["local_api"], "models": {"local_api": {"classifier": "llama3.1:8b"}}}', NULL, true, NULL, NULL, NULL, NULL, NULL, 'e937450c-fcd4-4d21-8fcc-912c1961c19f', NULL, false, 90, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: company; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.company (id, name, "atsType", "atsToken", active, "careerUrl", "createdAt", "lastFetchStatus", "consecutiveFailures", "lastOkAt", watched, "checkEvery", "nextCheckAt", "alertPolicy", "lastContentHash", "lastContentAlertAt", "pendingContentHash", "pastedAt", "pastedLines", "pastedNew", "crawlDelayMs", validator) VALUES (1, 'O''Reilly; Sons -- "Ltd"', 'GREENHOUSE', 'oreilly', true, NULL, '2026-09-28 09:20:51', NULL, 0, NULL, false, 'hour', NULL, 'matches', NULL, NULL, NULL, NULL, '{}', '{}', NULL, NULL);
INSERT INTO public.company (id, name, "atsType", "atsToken", active, "careerUrl", "createdAt", "lastFetchStatus", "consecutiveFailures", "lastOkAt", watched, "checkEvery", "nextCheckAt", "alertPolicy", "lastContentHash", "lastContentAlertAt", "pendingContentHash", "pastedAt", "pastedLines", "pastedNew", "crawlDelayMs", validator) VALUES (2, 'Київ Софт', 'LEVER', 'kyiv-soft', false, NULL, '2026-09-28 09:20:51.002', NULL, 0, NULL, false, 'hour', NULL, 'matches', NULL, NULL, NULL, NULL, '{}', '{}', NULL, NULL);


--
-- Data for Name: job; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.job (id, "companyId", "externalId", title, url, location, description, "postedAt", "fetchedAt", "fitScore", "salaryMin", "salaryMax", "techMatch", "redFlags", summary, status, "alertedAt", "applicationNotes", "appliedAt", "pipelineStage", "recruiterContact", "priorityRulesApplied", liveness, "livenessCode", "livenessCheckedAt", "descriptionSimhash", "crossListedOfJobId", "appliedResumeId", "appliedResumeText", "appliedResumeVersion", countries, "locationSource", regions, workplace, "salaryCurrency", "salaryPeriod", "sourcePayload", "sourceUpdatedAt", "sourceCheckedAt", "alertHeldAt", "descriptionOriginal", "descriptionRefreshedAt", employer, "employerKey") VALUES (1, 1, 'gh-1', 'Senior Engineer; Platform', 'https://boards.greenhouse.io/oreilly/jobs/1?a=1;b=2', 'Remote — Україна', 'Line one; with a semicolon.
Line two: it''s a ''quote'' and a \ backslash.
/* not a comment */ -- nor this;
$$ dollar $$ text
Зарплата: 5000$; JSON {"a": [1, 2]}', '2026-09-01 10:00:00', '2026-09-28 09:20:51.003', NULL, NULL, NULL, NULL, NULL, NULL, 'NEW', NULL, NULL, NULL, NULL, NULL, '{}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{UA,PL}', NULL, '{EUROPE}', 'REMOTE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: screening; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: applicant; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: candidate_fact; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: company_candidate; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: company_mute; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: cover_letter; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: cron_run; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: funnel_day; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: job_score; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: job_stage_event; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: job_verification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: posting_brief; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: resume_match; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: resume_review; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: screening_comparison; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: screening_verdict; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Name: ai_call_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_call_id_seq', 1, false);


--
-- Name: applicant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.applicant_id_seq', 1, false);


--
-- Name: candidate_fact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.candidate_fact_id_seq', 1, false);


--
-- Name: company_candidate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_candidate_id_seq', 1, false);


--
-- Name: company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_id_seq', 2, true);


--
-- Name: cover_letter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cover_letter_id_seq', 1, false);


--
-- Name: cron_run_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cron_run_id_seq', 1, false);


--
-- Name: job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_id_seq', 1, true);


--
-- Name: job_score_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_score_id_seq', 1, false);


--
-- Name: job_stage_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_stage_event_id_seq', 1, false);


--
-- Name: job_verification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_verification_id_seq', 1, false);


--
-- Name: notification_target_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notification_target_id_seq', 1, false);


--
-- Name: posting_brief_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posting_brief_id_seq', 1, false);


--
-- Name: profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profile_id_seq', 1, false);


--
-- Name: resume_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resume_id_seq', 1, false);


--
-- Name: resume_match_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resume_match_id_seq', 1, false);


--
-- Name: resume_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resume_review_id_seq', 1, false);


--
-- Name: screening_comparison_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_comparison_id_seq', 1, false);


--
-- Name: screening_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_id_seq', 1, false);


--
-- Name: screening_verdict_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.screening_verdict_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 1KDMBBzpkTxilpVcXKnPWacRJXnrON3chrvxm2GZSPlLe4dF58ihEnSBrVTz3xh

