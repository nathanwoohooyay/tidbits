--
-- PostgreSQL database dump
--

\connect tidbits_auth
\restrict TJFgwM3Lsx2nNAEFwZcVkq90xjHSXCTgZc34hntS4sxHEr8g5uc0wxkixH4ByL0

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (role_id, name) VALUES (1, 'client');
INSERT INTO public.roles (role_id, name) VALUES (2, 'auditor');
INSERT INTO public.roles (role_id, name) VALUES (3, 'reporter');
INSERT INTO public.roles (role_id, name) VALUES (4, 'admin');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (user_id, password_hash, role_id, token_version) VALUES (5, '$2a$10$K8.CrDqqdBwV2fPfdt0oCuZPP47uACvmb7xHAYpcVT/zlxD4BAhUa', 1, 1);
INSERT INTO public.users (user_id, password_hash, role_id, token_version) VALUES (3, '$2a$10$IX36PjfOpyJPHR0apwaFNOekN0Ul38bTa1DjFwmhhQX9HA.U4JbQa', 1, 1);
INSERT INTO public.users (user_id, password_hash, role_id, token_version) VALUES (2, '$2a$10$hloD3KqPYkk9WD9B9Y21nus5zyzB858vvIEVZDXk0dMz9JNTRacfq', 1, 1);
INSERT INTO public.users (user_id, password_hash, role_id, token_version) VALUES (1, '$2a$10$X37vCEMXcilibm1.xfEpleDB3WRNKvDHep8CtJmTd4T8qc8B4VDbO', 1, 1);
INSERT INTO public.users (user_id, password_hash, role_id, token_version) VALUES (4, '$2a$10$Ep0XVJF1ehUH0MhvouPjAOOT5Kei5ILIIH/mBVctYMoxlVnmr2ONq', 1, 1);


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.refresh_tokens (token_id, user_id, refresh_token, created_at, expires_at) VALUES (2, 1, '819afe8ca2a2155bb0d2b8f4182adbe872fdfec3f6ccc6208ade149450e36b29', '2026-10-20 16:36:09.845501', '2026-10-27 16:36:38.221');
INSERT INTO public.refresh_tokens (token_id, user_id, refresh_token, created_at, expires_at) VALUES (5, 3, 'f2c10fa349163ad48c3501c3c663aad430c75236c91fa07cf43d9c87c36f2d30', '2026-10-20 16:36:10.192214', '2026-10-27 16:36:38.441');
INSERT INTO public.refresh_tokens (token_id, user_id, refresh_token, created_at, expires_at) VALUES (3, 5, 'ed164212a12c0adadeeb23f9e7ac2cb82271abb1db2b4660ad1d34ed4f8161cb', '2026-10-20 16:36:09.968323', '2026-10-27 16:36:38.655');
INSERT INTO public.refresh_tokens (token_id, user_id, refresh_token, created_at, expires_at) VALUES (4, 4, '4c92c696b0053f51e2eb74aafb4fc154923d1bd0e4c7880ab19bc54b244dad91', '2026-10-20 16:36:10.079141', '2026-10-27 16:36:38.759');
INSERT INTO public.refresh_tokens (token_id, user_id, refresh_token, created_at, expires_at) VALUES (1, 2, '3b70d4d5d105c939380aa5ac725155767af2b026845258c7f33bfb5990282d5b', '2026-10-20 16:36:09.700677', '2026-10-27 16:36:38.969');


--
-- Name: refresh_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_token_id_seq', 15, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict TJFgwM3Lsx2nNAEFwZcVkq90xjHSXCTgZc34hntS4sxHEr8g5uc0wxkixH4ByL0

