--
-- PostgreSQL database dump
--

\restrict bnIS2Nk3vecCvb1Z3zioSqJ6d9z92pxzcwjCiCFLNui8mBn4t1JpQ7GwZuIEcL6

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES (1, 'u2_1792514168', 'u2_1792514168@example.com', '2026-10-20 16:36:08.808226', '4155550111', '2026-10-20 16:36:38.221977', 0, '1992-02-11');
INSERT INTO public.users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES (3, 'u1_1792514168', 'u1_1792514168@example.com', '2026-10-20 16:36:09.221411', '4155550110', '2026-10-20 16:36:38.441572', 0, '1991-01-10');
INSERT INTO public.users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES (5, 'u4_1792514168', 'u4_1792514168@example.com', '2026-10-20 16:36:09.497975', '4155550113', '2026-10-20 16:36:38.65538', 0, '1994-04-13');
INSERT INTO public.users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES (4, 'u3_1792514168', 'u3_1792514168@example.com', '2026-10-20 16:36:09.36223', '4155550112', '2026-10-20 16:36:38.760293', 0, '1993-03-12');
INSERT INTO public.users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES (2, 'u5_1792514168', 'u5_1792514168@example.com', '2026-10-20 16:36:09.02006', '4155550114', '2026-10-20 16:36:38.97073', 0, '1995-05-14');


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (12, 3, 'acct_0_4', 58892.61, '2026-10-20 16:36:11.36601');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (5, 4, 'acct_2_2', 22038.42, '2026-10-20 16:36:11.065784');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (8, 2, 'acct_4_1', 21659.16, '2026-10-20 16:36:11.194136');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (7, 5, 'acct_3_2', 58314.31, '2026-10-20 16:36:11.148603');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (3, 1, 'acct_1_3', 48336.45, '2026-10-20 16:36:10.980447');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (2, 1, 'acct_1_2', 41417.47, '2026-10-20 16:36:10.905949');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (10, 3, 'acct_0_2', 56188.43, '2026-10-20 16:36:11.288947');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (1, 1, 'acct_1_1', 40881.18, '2026-10-20 16:36:10.716755');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (6, 5, 'acct_3_1', 55536.86, '2026-10-20 16:36:11.110733');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (9, 3, 'acct_0_1', 49295.67, '2026-10-20 16:36:11.239945');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (11, 3, 'acct_0_3', 29198.5, '2026-10-20 16:36:11.332735');
INSERT INTO public.accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES (4, 4, 'acct_2_1', 20914.7, '2026-10-20 16:36:11.036145');


--
-- Data for Name: instruments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (15, 'V', 'Visa Inc.', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (21, 'HD', 'Home Depot (The)', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (22, 'COST', 'Costco', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (23, 'BAC', 'Bank of America', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (24, 'MRK', 'Merck & Co.', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (25, 'ABBV', 'AbbVie', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (26, 'KO', 'Coca-Cola Company (The)', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (27, 'ADBE', 'Adobe Inc.', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (28, 'NFLX', 'Netflix', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (29, 'PEP', 'PepsiCo', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (30, 'TMO', 'Thermo Fisher Scientific', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (31, 'CRM', 'Salesforce', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (32, 'AMD', 'Advanced Micro Devices', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (33, 'MCD', 'McDonald''s', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (34, 'CSCO', 'Cisco', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (35, 'WFC', 'Wells Fargo', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (36, 'ACN', 'Accenture', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (37, 'ABT', 'Abbott Laboratories', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (38, 'DHR', 'Danaher Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (39, 'LIN', 'Linde plc', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (40, 'DIS', 'Walt Disney Company (The)', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (41, 'TMUS', 'T-Mobile US', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (42, 'INTC', 'Intel', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (43, 'TXN', 'Texas Instruments', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (44, 'QCOM', 'Qualcomm', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (45, 'AMGN', 'Amgen', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (46, 'CMCSA', 'Comcast', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (47, 'VZ', 'Verizon', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (48, 'INTU', 'Intuit', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (49, 'PFE', 'Pfizer', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (50, 'PM', 'Philip Morris International', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (51, 'IBM', 'IBM', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (52, 'NOW', 'ServiceNow', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (53, 'CAT', 'Caterpillar Inc.', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (54, 'GS', 'Goldman Sachs', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (55, 'GE', 'GE Aerospace', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (56, 'ISRG', 'Intuitive Surgical', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (57, 'BKNG', 'Booking Holdings', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (58, 'SPGI', 'S&P Global', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (59, 'AXP', 'American Express', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (60, 'UNP', 'Union Pacific Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (61, 'AMAT', 'Applied Materials', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (62, 'T', 'AT&T', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (63, 'LOW', 'Lowe''s', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (64, 'MS', 'Morgan Stanley', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (65, 'BLK', 'BlackRock', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (66, 'RTX', 'RTX Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (67, 'HON', 'Honeywell Technologies', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (68, 'SYK', 'Stryker Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (69, 'GILD', 'Gilead Sciences', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (70, 'MDT', 'Medtronic', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (71, 'SBUX', 'Starbucks', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (72, 'ELV', 'Elevance Health', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (73, 'DE', 'Deere & Company', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (74, 'PLD', 'Prologis', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (75, 'ADI', 'Analog Devices', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (76, 'TJX', 'TJX Companies', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (77, 'C', 'Citigroup', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (78, 'LRCX', 'Lam Research', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (79, 'CB', 'Chubb Limited', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (80, 'SCHW', 'Charles Schwab Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (81, 'MU', 'Micron Technology', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (82, 'SO', 'Southern Company', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (83, 'PANW', 'Palo Alto Networks', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (84, 'VRTX', 'Vertex Pharmaceuticals', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (85, 'NKE', 'Nike, Inc.', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (86, 'ETN', 'Eaton Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (87, 'ADP', 'Automatic Data Processing', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (88, 'BMY', 'Bristol Myers Squibb', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (89, 'PGR', 'Progressive Corporation', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (90, 'COP', 'ConocoPhillips', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (91, 'CI', 'Cigna', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (92, 'ZTS', 'Zoetis', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (1, 'AAPL', 'Apple Inc.', 'equity', 'US', 340.794, '2026-10-20 16:36:23.487941', 'USD', -2.146, -0.6257654400186622, 342.94);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (20, 'ORCL', 'Oracle Corporation', 'equity', 'US', 132.333, '2026-10-20 16:36:34.046331', 'USD', 2.743, 2.1166756694189366, 129.59);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (8, 'BRK.B', 'Berkshire Hathaway', 'equity', 'US', 537.77, '2026-10-20 16:36:18.687171', 'USD', 5.54, 1.0409033688442966, 532.23);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (16, 'XOM', 'ExxonMobil', 'equity', 'US', 176.73, '2026-10-20 16:36:35.550378', 'USD', -1.55, -0.869418891631142, 178.28);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (17, 'MA', 'Mastercard', 'equity', 'US', 620.79, '2026-10-20 16:36:34.286534', 'USD', 4.39, 0.7121998702141467, 616.4);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (19, 'PG', 'Procter & Gamble', 'equity', 'US', 158.34, '2026-10-20 16:36:21.328048', 'USD', 0.65, 0.41220115416323166, 157.69);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (14, 'UNH', 'UnitedHealth Group', 'equity', 'US', 421.61, '2026-10-20 16:36:28.2862', 'USD', 14.73, 3.620232009437672, 406.88);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (12, 'JPM', 'JPMorgan Chase', 'equity', 'US', 335.87, '2026-10-20 16:36:35.933702', 'USD', 2.34, 0.701586064222109, 333.53);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (11, 'TSLA', 'Tesla, Inc.', 'equity', 'US', 374.045, '2026-10-20 16:36:34.945837', 'USD', 5.985, 1.6260935717002662, 368.06);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (2, 'MSFT', 'Microsoft', 'equity', 'US', 532.1, '2026-10-20 16:36:31.605433', 'USD', -1.42, -0.2661568451042135, 533.52);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (10, 'AVGO', 'Broadcom', 'equity', 'US', 335.5, '2026-10-20 16:36:33.755791', 'USD', 0.91, 0.27197465554858186, 334.59);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (4, 'AMZN', 'Amazon', 'equity', 'US', 262.78, '2026-10-20 16:36:35.354595', 'USD', 0.33, 0.12573823585444846, 262.45);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (3, 'NVDA', 'Nvidia', 'equity', 'US', 217.07, '2026-10-20 16:36:36.154462', 'USD', -0.02, -0.009212768897692201, 217.09);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (93, 'MO', 'Altria', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (94, 'REGN', 'Regeneron Pharmaceuticals', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (95, 'DUK', 'Duke Energy', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (96, 'MDLZ', 'Mondelez International', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (97, 'SLB', 'Schlumberger', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (98, 'ANET', 'Arista Networks', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (99, 'EOG', 'EOG Resources', 'equity', 'US', NULL, '2026-09-30 17:34:52.51439', 'USD', NULL, NULL, NULL);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (6, 'GOOG', 'Alphabet Inc. (Class C)', 'equity', 'US', 337.775, '2026-10-20 16:36:26.666762', 'USD', -2.385, -0.7011406396989652, 340.16);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (13, 'WMT', 'Walmart', 'equity', 'US', 118.07, '2026-10-20 16:36:26.991449', 'USD', -0.63, -0.5307497893850042, 118.7);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (9, 'LLY', 'Lilly (Eli)', 'equity', 'US', 1294.02, '2026-10-20 16:36:28.586722', 'USD', 53.68, 4.327845590725124, 1240.34);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (18, 'JNJ', 'Johnson & Johnson', 'equity', 'US', 258.77, '2026-10-20 16:36:31.946622', 'USD', 4.98, 1.962252255802041, 253.79);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (5, 'GOOGL', 'Alphabet Inc. (Class A)', 'equity', 'US', 341.58, '2026-10-20 16:36:34.765381', 'USD', -2.6, -0.7554186762740427, 344.18);
INSERT INTO public.instruments (instrument_id, ticker, name, type, exchange, last_price, last_updated, currency, change, change_percent, prev_close) VALUES (7, 'META', 'Meta Platforms', 'equity', 'US', 690.7, '2026-10-20 16:36:35.735397', 'USD', -14.74, -2.089476071671581, 705.44);


--
-- Data for Name: account_holdings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (1, 18, 1, 258.8, '2026-10-20 16:36:15.721124');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (6, 12, 1, 335.9, '2026-10-20 16:36:17.138951');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (2, 8, 1, 537.8, '2026-10-20 16:36:18.69519');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (4, 19, 4, 633.4, '2026-10-20 16:36:21.331629');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (4, 9, 4, 5176.6, '2026-10-20 16:36:21.66964');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (5, 9, 2, 2588.3, '2026-10-20 16:36:22.509822');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (1, 13, 4, 472.36, '2026-10-20 16:36:22.728814');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (3, 1, 1, 340.83, '2026-10-20 16:36:23.491022');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (6, 6, 2, 675.62, '2026-10-20 16:36:24.481679');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (10, 10, 1, 335.55999999999995, '2026-10-20 16:36:25.528409');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (10, 20, 1, 132.36, '2026-10-20 16:36:26.068209');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (5, 18, 4, 1035.2, '2026-10-20 16:36:26.290867');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (4, 13, 1, 118.09, '2026-10-20 16:36:27.005862');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (3, 9, 4, 5176.6, '2026-10-20 16:36:28.589652');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (9, 17, 4, 2483.36, '2026-10-20 16:36:30.188139');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (6, 11, 3, 1122.33, '2026-10-20 16:36:30.794943');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (10, 7, 4, 2763.24, '2026-10-20 16:36:31.387671');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (9, 2, 4, 2128.67, '2026-10-20 16:36:31.609054');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (8, 18, 4, 1035.2, '2026-10-20 16:36:31.949935');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (11, 10, 3, 1006.68, '2026-10-20 16:36:32.38372');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (11, 4, 1, 262.82, '2026-10-20 16:36:32.653406');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (12, 20, 2, 264.72, '2026-10-20 16:36:33.468246');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (3, 20, 4, 529.44, '2026-10-20 16:36:34.051185');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (2, 17, 3, 1862.52, '2026-10-20 16:36:34.296101');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (8, 4, 2, 525.64, '2026-10-20 16:36:34.568566');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (2, 5, 2, 683.24, '2026-10-20 16:36:34.772331');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (7, 11, 4, 1496.44, '2026-10-20 16:36:34.948725');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (2, 4, 2, 525.64, '2026-10-20 16:36:35.361444');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (3, 16, 2, 353.5, '2026-10-20 16:36:35.553449');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (2, 7, 4, 2763.24, '2026-10-20 16:36:35.739045');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (10, 12, 5, 1679.49, '2026-10-20 16:36:35.956219');
INSERT INTO public.account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES (10, 3, 2, 434.2, '2026-10-20 16:36:36.155785');
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (1, 4, 13, 4, 118.09, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (3, 6, 9, 4, 1294.15, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (4, 10, 13, 2, 118.09, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (2, 2, 5, 1, 341.62, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (5, 6, 9, 4, 1293.89, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (6, 9, 18, 3, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (7, 1, 18, 1, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (8, 9, 18, 1, 258.74, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (9, 10, 13, 1, 118.05, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (10, 10, 13, 1, 118.05, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (11, 6, 12, 1, 335.9, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (12, 9, 18, 2, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (13, 4, 16, 1, 176.75, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (14, 1, 9, 1, 1294.15, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (15, 2, 8, 1, 537.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (16, 10, 17, 4, 620.84, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (17, 1, 9, 1, 1293.89, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (18, 9, 18, 4, 258.74, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (19, 4, 13, 4, 118.05, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (20, 4, 4, 196028, 262.82, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (21, 12, 7, 3, 690.81, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (22, 4, 19, 4, 158.35, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (23, 4, 9, 4, 1294.15, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (24, 10, 10, 3, 335.56, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (25, 5, 9, 2, 1294.15, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (26, 1, 13, 4, 118.09, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (27, 4, 16, 1, 176.71, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (28, 3, 1, 1, 340.83, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (29, 10, 10, 1, 335.44, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (30, 12, 7, 3, 690.59, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (31, 2, 5, 1, 341.54, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (32, 6, 6, 2, 337.81, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (33, 10, 17, 4, 620.74, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (34, 1, 11, 3, 374.11, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (35, 3, 17, 186790, 620.84, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (36, 10, 10, 1, 335.44, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (37, 6, 3, 4, 217.1, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (38, 10, 20, 1, 132.36, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (39, 5, 18, 4, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (40, 8, 6, 120351, 337.81, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (41, 2, 6, 142260, 337.81, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (42, 4, 13, 1, 118.09, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (43, 3, 18, 3, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (44, 6, 3, 4, 217.04, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (45, 7, 10, 2, 335.56, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (46, 9, 14, 171354, 421.65, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (47, 2, 2, 142636, 532.17, 'buy', 'rejected');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (48, 3, 9, 4, 1294.15, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (49, 10, 12, 3, 335.9, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (50, 5, 5, 1, 341.62, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (51, 3, 18, 3, 258.74, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (52, 9, 17, 3, 620.84, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (53, 1, 11, 3, 373.98, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (54, 9, 17, 1, 620.84, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (55, 9, 2, 1, 532.17, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (56, 6, 11, 3, 374.11, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (57, 5, 5, 1, 341.54, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (58, 10, 7, 4, 690.81, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (59, 9, 2, 3, 532.17, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (60, 8, 18, 4, 258.8, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (61, 11, 10, 3, 335.56, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (62, 11, 4, 1, 262.82, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (63, 2, 7, 3, 690.81, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (64, 12, 20, 2, 132.36, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (65, 7, 10, 2, 335.44, 'sell', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (66, 3, 20, 4, 132.36, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (67, 2, 17, 3, 620.84, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (68, 8, 4, 2, 262.82, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (69, 2, 5, 2, 341.62, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (70, 7, 11, 4, 374.11, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (71, 2, 4, 2, 262.82, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (72, 3, 16, 2, 176.75, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (73, 2, 7, 1, 690.81, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (74, 10, 12, 2, 335.9, 'buy', 'filled');
INSERT INTO public.orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES (75, 10, 3, 2, 217.1, 'buy', 'filled');


--
-- Data for Name: account_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (1, 4, NULL, 438, 'deposit', '2026-10-20 16:36:11.587266');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (2, 4, NULL, 238, 'withdraw', '2026-10-20 16:36:11.775238');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (3, 4, NULL, 25148, 'deposit', '2026-10-20 16:36:11.984103');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (4, 2, NULL, 41246, 'deposit', '2026-10-20 16:36:12.738947');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (5, 4, NULL, 3327, 'deposit', '2026-10-20 16:36:13.132063');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (6, 6, NULL, 57672, 'deposit', '2026-10-20 16:36:13.443812');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (7, 10, NULL, 58286, 'deposit', '2026-10-20 16:36:13.994851');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (8, 4, 1, 472.36, 'buy', '2026-10-20 16:36:14.12338');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (9, 6, 3, 5176.6, 'buy', '2026-10-20 16:36:14.395638');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (10, 10, 4, 236.18, 'buy', '2026-10-20 16:36:14.641372');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (11, 9, NULL, 47343, 'deposit', '2026-10-20 16:36:14.850201');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (12, 2, 2, 341.62, 'buy', '2026-10-20 16:36:14.88847');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (13, 6, 5, 5175.56, 'sell', '2026-10-20 16:36:15.116496');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (14, 1, NULL, 39632, 'deposit', '2026-10-20 16:36:15.298784');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (15, 9, 6, 776.4, 'buy', '2026-10-20 16:36:15.442534');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (16, 8, NULL, 1606, 'deposit', '2026-10-20 16:36:15.637699');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (17, 8, NULL, 1406, 'withdraw', '2026-10-20 16:36:15.724759');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (18, 1, 7, 258.8, 'buy', '2026-10-20 16:36:15.72629');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (19, 9, 8, 258.74, 'sell', '2026-10-20 16:36:16.172579');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (20, 9, NULL, 1721, 'deposit', '2026-10-20 16:36:16.44709');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (21, 10, 9, 118.05, 'sell', '2026-10-20 16:36:16.478154');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (22, 10, 10, 118.05, 'sell', '2026-10-20 16:36:16.83327');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (23, 6, NULL, 1216, 'deposit', '2026-10-20 16:36:17.122223');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (24, 6, 11, 335.9, 'buy', '2026-10-20 16:36:17.148299');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (25, 2, NULL, 2833, 'deposit', '2026-10-20 16:36:17.52244');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (26, 9, 12, 517.6, 'buy', '2026-10-20 16:36:17.531435');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (27, 2, NULL, 3711, 'deposit', '2026-10-20 16:36:17.907125');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (28, 4, 13, 176.75, 'buy', '2026-10-20 16:36:17.954028');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (29, 11, NULL, 3046, 'deposit', '2026-10-20 16:36:18.30734');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (30, 1, 14, 1294.15, 'buy', '2026-10-20 16:36:18.377243');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (31, 2, 15, 537.8, 'buy', '2026-10-20 16:36:18.701415');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (32, 1, NULL, 3356, 'deposit', '2026-10-20 16:36:18.70477');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (33, 11, NULL, 1385, 'deposit', '2026-10-20 16:36:19.193795');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (34, 10, 16, 2483.36, 'buy', '2026-10-20 16:36:19.317668');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (35, 10, NULL, 3248, 'deposit', '2026-10-20 16:36:19.539787');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (36, 1, 17, 1293.89, 'sell', '2026-10-20 16:36:19.672809');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (37, 9, 18, 1034.96, 'sell', '2026-10-20 16:36:19.974467');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (38, 12, NULL, 1777, 'deposit', '2026-10-20 16:36:20.068059');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (39, 4, 19, 472.2, 'sell', '2026-10-20 16:36:20.334341');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (40, 8, NULL, 962, 'deposit', '2026-10-20 16:36:20.641812');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (41, 8, NULL, 962, 'withdraw', '2026-10-20 16:36:20.685279');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (42, 12, NULL, 55490, 'deposit', '2026-10-20 16:36:20.857977');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (43, 12, 21, 2072.43, 'buy', '2026-10-20 16:36:21.079901');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (44, 4, 22, 633.4, 'buy', '2026-10-20 16:36:21.336141');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (45, 7, NULL, 2397, 'deposit', '2026-10-20 16:36:21.658805');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (46, 4, 23, 5176.6, 'buy', '2026-10-20 16:36:21.672134');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (47, 10, 24, 1006.68, 'buy', '2026-10-20 16:36:22.05359');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (48, 10, NULL, 1175, 'deposit', '2026-10-20 16:36:22.053768');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (49, 5, NULL, 20423, 'deposit', '2026-10-20 16:36:22.258456');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (50, 5, 25, 2588.3, 'buy', '2026-10-20 16:36:22.511861');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (51, 1, 26, 472.36, 'buy', '2026-10-20 16:36:22.731248');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (52, 8, NULL, 1304, 'deposit', '2026-10-20 16:36:22.9907');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (53, 4, 27, 176.71, 'sell', '2026-10-20 16:36:23.018786');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (54, 8, NULL, 1304, 'withdraw', '2026-10-20 16:36:23.030238');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (55, 3, NULL, 54737, 'deposit', '2026-10-20 16:36:23.280381');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (56, 3, 28, 340.83, 'buy', '2026-10-20 16:36:23.493106');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (57, 7, NULL, 1437, 'withdraw', '2026-10-20 16:36:23.56637');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (58, 10, 29, 335.44, 'sell', '2026-10-20 16:36:23.84992');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (59, 12, 30, 2071.77, 'sell', '2026-10-20 16:36:24.074496');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (60, 2, 31, 341.54, 'sell', '2026-10-20 16:36:24.249945');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (61, 6, 32, 675.62, 'buy', '2026-10-20 16:36:24.490207');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (62, 9, NULL, 3890, 'deposit', '2026-10-20 16:36:24.520259');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (63, 10, 33, 2482.96, 'sell', '2026-10-20 16:36:24.829584');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (64, 1, 34, 1122.33, 'buy', '2026-10-20 16:36:25.109978');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (65, 10, 36, 335.44, 'sell', '2026-10-20 16:36:25.528612');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (66, 6, 37, 868.4, 'buy', '2026-10-20 16:36:25.814711');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (67, 10, 38, 132.36, 'buy', '2026-10-20 16:36:26.069545');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (68, 5, 39, 1035.2, 'buy', '2026-10-20 16:36:26.292469');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (69, 4, 42, 118.09, 'buy', '2026-10-20 16:36:27.009458');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (70, 3, 43, 776.4, 'buy', '2026-10-20 16:36:27.216346');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (71, 7, NULL, 58851, 'deposit', '2026-10-20 16:36:27.438402');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (72, 6, 44, 868.16, 'sell', '2026-10-20 16:36:27.495757');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (73, 7, 45, 671.12, 'buy', '2026-10-20 16:36:27.744106');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (74, 12, NULL, 1891, 'deposit', '2026-10-20 16:36:27.774669');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (75, 3, 48, 5176.6, 'buy', '2026-10-20 16:36:28.597271');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (76, 9, NULL, 954, 'deposit', '2026-10-20 16:36:28.720253');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (77, 10, 49, 1007.69, 'buy', '2026-10-20 16:36:28.811015');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (78, 5, 50, 341.62, 'buy', '2026-10-20 16:36:29.093513');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (79, 1, NULL, 1375, 'withdraw', '2026-10-20 16:36:29.178551');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (80, 3, 51, 776.22, 'sell', '2026-10-20 16:36:29.432621');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (81, 9, 52, 1862.52, 'buy', '2026-10-20 16:36:29.696062');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (82, 1, NULL, 3998, 'deposit', '2026-10-20 16:36:29.845055');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (83, 1, 53, 1121.94, 'sell', '2026-10-20 16:36:29.876001');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (84, 9, 54, 620.84, 'buy', '2026-10-20 16:36:30.188314');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (85, 9, 55, 532.17, 'buy', '2026-10-20 16:36:30.441213');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (86, 11, NULL, 1257, 'withdraw', '2026-10-20 16:36:30.490175');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (87, 5, NULL, 1542, 'deposit', '2026-10-20 16:36:30.783577');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (88, 6, 56, 1122.33, 'buy', '2026-10-20 16:36:30.796251');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (89, 5, 57, 341.54, 'sell', '2026-10-20 16:36:31.070125');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (90, 10, 58, 2763.24, 'buy', '2026-10-20 16:36:31.389116');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (91, 9, 59, 1596.5, 'buy', '2026-10-20 16:36:31.609231');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (92, 8, NULL, 20892, 'deposit', '2026-10-20 16:36:31.679828');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (93, 8, 60, 1035.2, 'buy', '2026-10-20 16:36:31.95175');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (94, 11, NULL, 27294, 'deposit', '2026-10-20 16:36:32.06369');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (95, 11, 61, 1006.68, 'buy', '2026-10-20 16:36:32.386494');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (96, 11, 62, 262.82, 'buy', '2026-10-20 16:36:32.654982');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (97, 4, NULL, 1495, 'deposit', '2026-10-20 16:36:32.83651');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (98, 8, NULL, 2128, 'deposit', '2026-10-20 16:36:33.165818');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (99, 2, 63, 2072.43, 'buy', '2026-10-20 16:36:33.170042');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (100, 12, 64, 264.72, 'buy', '2026-10-20 16:36:33.469743');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (101, 5, NULL, 3697, 'deposit', '2026-10-20 16:36:33.73675');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (102, 7, 65, 670.88, 'sell', '2026-10-20 16:36:33.759497');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (103, 3, 66, 529.44, 'buy', '2026-10-20 16:36:34.052648');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (104, 2, 67, 1862.52, 'buy', '2026-10-20 16:36:34.300689');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (105, 8, 68, 525.64, 'buy', '2026-10-20 16:36:34.572803');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (106, 2, 69, 683.24, 'buy', '2026-10-20 16:36:34.77516');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (107, 7, 70, 1496.44, 'buy', '2026-10-20 16:36:34.951066');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (108, 2, 71, 525.64, 'buy', '2026-10-20 16:36:35.363827');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (109, 3, NULL, 3604, 'deposit', '2026-10-20 16:36:35.521615');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (110, 3, 72, 353.5, 'buy', '2026-10-20 16:36:35.555122');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (111, 2, 73, 690.81, 'buy', '2026-10-20 16:36:35.739211');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (112, 10, 74, 671.8, 'buy', '2026-10-20 16:36:35.956379');
INSERT INTO public.account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES (113, 10, 75, 434.2, 'buy', '2026-10-20 16:36:36.156734');


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (1, '2026-10-20 16:36:12.11842', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (2, '2026-10-20 16:36:12.913038', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (3, '2026-10-20 16:36:13.61704', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (4, '2026-10-20 16:36:14.098509', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (1, '2026-10-20 16:36:14.131858', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (1, '2026-10-20 16:36:14.144317', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (3, '2026-10-20 16:36:14.400009', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (3, '2026-10-20 16:36:14.417468', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (5, '2026-10-20 16:36:14.511887', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (4, '2026-10-20 16:36:14.64773', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (4, '2026-10-20 16:36:14.661996', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (2, '2026-10-20 16:36:14.890724', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (2, '2026-10-20 16:36:14.897246', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (6, '2026-10-20 16:36:14.997139', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (5, '2026-10-20 16:36:15.119494', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (5, '2026-10-20 16:36:15.126819', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (7, '2026-10-20 16:36:15.385549', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (6, '2026-10-20 16:36:15.446498', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (6, '2026-10-20 16:36:15.462503', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (7, '2026-10-20 16:36:15.729912', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (7, '2026-10-20 16:36:15.765528', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (8, '2026-10-20 16:36:15.968121', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (9, '2026-10-20 16:36:16.170862', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (8, '2026-10-20 16:36:16.174322', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (8, '2026-10-20 16:36:16.18462', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (9, '2026-10-20 16:36:16.480285', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (9, '2026-10-20 16:36:16.503587', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (10, '2026-10-20 16:36:16.678909', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (10, '2026-10-20 16:36:16.835357', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (10, '2026-10-20 16:36:16.840495', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (11, '2026-10-20 16:36:16.979141', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (11, '2026-10-20 16:36:17.160008', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (11, '2026-10-20 16:36:17.177081', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (12, '2026-10-20 16:36:17.373596', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (12, '2026-10-20 16:36:17.536297', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (12, '2026-10-20 16:36:17.549872', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (13, '2026-10-20 16:36:17.768355', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (13, '2026-10-20 16:36:17.959441', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (13, '2026-10-20 16:36:17.975804', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (14, '2026-10-20 16:36:18.157645', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (14, '2026-10-20 16:36:18.382712', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (14, '2026-10-20 16:36:18.407308', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (15, '2026-10-20 16:36:18.535744', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (15, '2026-10-20 16:36:18.703329', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (15, '2026-10-20 16:36:18.752652', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (16, '2026-10-20 16:36:18.995602', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (17, '2026-10-20 16:36:19.312149', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (16, '2026-10-20 16:36:19.32161', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (16, '2026-10-20 16:36:19.346383', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (17, '2026-10-20 16:36:19.678467', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (17, '2026-10-20 16:36:19.698934', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (18, '2026-10-20 16:36:19.7766', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (18, '2026-10-20 16:36:19.976099', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (18, '2026-10-20 16:36:19.984375', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (19, '2026-10-20 16:36:20.182029', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (19, '2026-10-20 16:36:20.341835', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (19, '2026-10-20 16:36:20.351403', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (20, '2026-10-20 16:36:20.406817', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (20, '2026-10-20 16:36:20.568225', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (21, '2026-10-20 16:36:20.926967', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (21, '2026-10-20 16:36:21.082972', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (21, '2026-10-20 16:36:21.091866', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (22, '2026-10-20 16:36:21.193105', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (22, '2026-10-20 16:36:21.347952', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (22, '2026-10-20 16:36:21.359983', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (23, '2026-10-20 16:36:21.456222', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (23, '2026-10-20 16:36:21.675634', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (23, '2026-10-20 16:36:21.707163', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (24, '2026-10-20 16:36:21.907775', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (24, '2026-10-20 16:36:22.055822', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (24, '2026-10-20 16:36:22.091435', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (25, '2026-10-20 16:36:22.339157', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (25, '2026-10-20 16:36:22.513477', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (25, '2026-10-20 16:36:22.51854', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (26, '2026-10-20 16:36:22.586634', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (27, '2026-10-20 16:36:22.729118', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (26, '2026-10-20 16:36:22.732548', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (26, '2026-10-20 16:36:22.771102', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (27, '2026-10-20 16:36:23.034654', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (27, '2026-10-20 16:36:23.074352', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (28, '2026-10-20 16:36:23.346991', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (28, '2026-10-20 16:36:23.499308', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (28, '2026-10-20 16:36:23.520175', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (29, '2026-10-20 16:36:23.714648', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (29, '2026-10-20 16:36:23.853745', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (29, '2026-10-20 16:36:23.882098', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (30, '2026-10-20 16:36:23.923214', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (30, '2026-10-20 16:36:24.075873', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (30, '2026-10-20 16:36:24.080151', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (31, '2026-10-20 16:36:24.119646', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (31, '2026-10-20 16:36:24.251499', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (31, '2026-10-20 16:36:24.2638', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (32, '2026-10-20 16:36:24.357028', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (32, '2026-10-20 16:36:24.498914', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (32, '2026-10-20 16:36:24.548801', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (33, '2026-10-20 16:36:24.694938', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (33, '2026-10-20 16:36:24.831422', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (33, '2026-10-20 16:36:24.846675', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (34, '2026-10-20 16:36:24.948508', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (34, '2026-10-20 16:36:25.112617', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (34, '2026-10-20 16:36:25.119347', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (35, '2026-10-20 16:36:25.219924', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (35, '2026-10-20 16:36:25.346583', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (36, '2026-10-20 16:36:25.401311', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (36, '2026-10-20 16:36:25.529903', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (36, '2026-10-20 16:36:25.53483', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (37, '2026-10-20 16:36:25.631137', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (37, '2026-10-20 16:36:25.819429', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (37, '2026-10-20 16:36:25.833103', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (38, '2026-10-20 16:36:25.920267', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (38, '2026-10-20 16:36:26.070512', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (38, '2026-10-20 16:36:26.074517', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (39, '2026-10-20 16:36:26.154716', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (39, '2026-10-20 16:36:26.293721', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (39, '2026-10-20 16:36:26.299796', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (40, '2026-10-20 16:36:26.353095', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (40, '2026-10-20 16:36:26.506152', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (41, '2026-10-20 16:36:26.547226', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (41, '2026-10-20 16:36:26.667088', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (42, '2026-10-20 16:36:26.762997', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (43, '2026-10-20 16:36:27.005197', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (42, '2026-10-20 16:36:27.011209', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (42, '2026-10-20 16:36:27.038939', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (44, '2026-10-20 16:36:27.207373', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (43, '2026-10-20 16:36:27.227798', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (43, '2026-10-20 16:36:27.264919', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (44, '2026-10-20 16:36:27.52241', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (44, '2026-10-20 16:36:27.538628', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (45, '2026-10-20 16:36:27.750262', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (45, '2026-10-20 16:36:27.769355', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (46, '2026-10-20 16:36:28.28664', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (47, '2026-10-20 16:36:28.425629', 'placed', 'rejected');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (48, '2026-10-20 16:36:28.599291', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (48, '2026-10-20 16:36:28.609454', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (49, '2026-10-20 16:36:28.812189', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (49, '2026-10-20 16:36:28.81793', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (50, '2026-10-20 16:36:29.095012', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (50, '2026-10-20 16:36:29.099991', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (51, '2026-10-20 16:36:29.439774', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (51, '2026-10-20 16:36:29.450212', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (52, '2026-10-20 16:36:29.697929', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (52, '2026-10-20 16:36:29.709425', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (53, '2026-10-20 16:36:29.880591', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (53, '2026-10-20 16:36:29.892778', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (54, '2026-10-20 16:36:30.190795', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (54, '2026-10-20 16:36:30.209578', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (55, '2026-10-20 16:36:30.443536', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (55, '2026-10-20 16:36:30.45795', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (56, '2026-10-20 16:36:30.797471', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (56, '2026-10-20 16:36:30.816033', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (57, '2026-10-20 16:36:31.0718', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (57, '2026-10-20 16:36:31.089266', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (58, '2026-10-20 16:36:31.390374', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (58, '2026-10-20 16:36:31.400075', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (59, '2026-10-20 16:36:31.611501', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (59, '2026-10-20 16:36:31.61694', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (60, '2026-10-20 16:36:31.953207', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (60, '2026-10-20 16:36:31.960125', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (61, '2026-10-20 16:36:32.390314', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (61, '2026-10-20 16:36:32.400685', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (62, '2026-10-20 16:36:32.692899', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (62, '2026-10-20 16:36:32.707963', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (63, '2026-10-20 16:36:33.174668', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (63, '2026-10-20 16:36:33.196788', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (64, '2026-10-20 16:36:33.471107', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (64, '2026-10-20 16:36:33.47569', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (65, '2026-10-20 16:36:33.761791', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (65, '2026-10-20 16:36:33.767949', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (66, '2026-10-20 16:36:34.053633', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (66, '2026-10-20 16:36:34.057425', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (67, '2026-10-20 16:36:34.301965', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (67, '2026-10-20 16:36:34.308309', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (68, '2026-10-20 16:36:34.574339', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (68, '2026-10-20 16:36:34.581254', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (69, '2026-10-20 16:36:34.77991', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (69, '2026-10-20 16:36:34.785863', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (70, '2026-10-20 16:36:34.952429', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (70, '2026-10-20 16:36:34.962624', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (71, '2026-10-20 16:36:35.365841', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (71, '2026-10-20 16:36:35.369639', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (72, '2026-10-20 16:36:35.556198', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (72, '2026-10-20 16:36:35.560037', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (73, '2026-10-20 16:36:35.741428', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (73, '2026-10-20 16:36:35.747226', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (74, '2026-10-20 16:36:35.960378', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (74, '2026-10-20 16:36:35.98553', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (75, '2026-10-20 16:36:36.15764', 'placed', 'accepted');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (75, '2026-10-20 16:36:36.161342', 'accepted', 'filled');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (45, '2026-10-20 16:36:27.53343', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (46, '2026-10-20 16:36:27.993843', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (47, '2026-10-20 16:36:28.159387', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (48, '2026-10-20 16:36:28.350969', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (49, '2026-10-20 16:36:28.55316', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (50, '2026-10-20 16:36:28.923943', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (51, '2026-10-20 16:36:29.280971', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (52, '2026-10-20 16:36:29.52152', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (53, '2026-10-20 16:36:29.665147', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (54, '2026-10-20 16:36:30.052582', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (55, '2026-10-20 16:36:30.281764', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (56, '2026-10-20 16:36:30.654347', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (57, '2026-10-20 16:36:30.95034', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (58, '2026-10-20 16:36:31.223314', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (59, '2026-10-20 16:36:31.468052', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (60, '2026-10-20 16:36:31.784009', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (61, '2026-10-20 16:36:32.176657', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (62, '2026-10-20 16:36:32.532202', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (63, '2026-10-20 16:36:33.019756', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (64, '2026-10-20 16:36:33.363564', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (65, '2026-10-20 16:36:33.595861', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (66, '2026-10-20 16:36:33.90697', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (67, '2026-10-20 16:36:34.146969', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (68, '2026-10-20 16:36:34.419536', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (69, '2026-10-20 16:36:34.590014', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (70, '2026-10-20 16:36:34.785708', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (71, '2026-10-20 16:36:34.98428', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (72, '2026-10-20 16:36:35.199192', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (73, '2026-10-20 16:36:35.363643', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (74, '2026-10-20 16:36:35.686894', NULL, 'placed');
INSERT INTO public.order_status_history (order_id, changed_at, old_status, new_status) VALUES (75, '2026-10-20 16:36:35.898889', NULL, 'placed');


--
-- Data for Name: portfolio_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: transaction_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (1, 4, 4, 'deposit', 438, 1, NULL, 'success', '2026-10-20 16:36:11.591756');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (2, 4, 4, 'withdraw', 238, 2, NULL, 'success', '2026-10-20 16:36:11.777626');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (3, 4, 4, 'deposit', 25148, 3, NULL, 'success', '2026-10-20 16:36:11.987854');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (4, 4, 4, 'ORDER_PLACED', 400, NULL, 1, 'success', '2026-10-20 16:36:12.193461');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (5, 1, 2, 'deposit', 41246, 4, NULL, 'success', '2026-10-20 16:36:12.748013');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (6, 1, 2, 'ORDER_PLACED', 100, NULL, 2, 'success', '2026-10-20 16:36:12.928113');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (8, 4, 4, 'deposit', 3327, 5, NULL, 'success', '2026-10-20 16:36:13.138256');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (9, 5, 6, 'deposit', 57672, 6, NULL, 'success', '2026-10-20 16:36:13.454282');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (10, 5, 6, 'ORDER_PLACED', 400, NULL, 3, 'success', '2026-10-20 16:36:13.636');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (11, 3, 10, 'deposit', 58286, 7, NULL, 'success', '2026-10-20 16:36:13.999734');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (12, 3, 10, 'ORDER_PLACED', 200, NULL, 4, 'success', '2026-10-20 16:36:14.134482');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (13, 4, 4, 'ORDER_ACCEPTED', 472.36, 8, 1, 'success', '2026-10-20 16:36:14.141689');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (14, 4, 4, 'ORDER_FILLED', 472.36, 8, 1, 'success', '2026-10-20 16:36:14.157322');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (16, 5, 6, 'ORDER_ACCEPTED', 5176.6, 9, 3, 'success', '2026-10-20 16:36:14.41546');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (17, 5, 6, 'ORDER_FILLED', 5176.6, 9, 3, 'success', '2026-10-20 16:36:14.452484');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (18, 5, 6, 'ORDER_PLACED', 400, NULL, 5, 'success', '2026-10-20 16:36:14.5358');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (20, 3, 10, 'ORDER_ACCEPTED', 236.18, 10, 4, 'success', '2026-10-20 16:36:14.660512');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (21, 3, 10, 'ORDER_FILLED', 236.18, 10, 4, 'success', '2026-10-20 16:36:14.687466');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (22, 3, 9, 'deposit', 47343, 11, NULL, 'success', '2026-10-20 16:36:14.852735');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (25, 1, 2, 'ORDER_ACCEPTED', 341.62, 12, 2, 'success', '2026-10-20 16:36:14.896528');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (26, 1, 2, 'ORDER_FILLED', 341.62, 12, 2, 'success', '2026-10-20 16:36:14.930407');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (27, 3, 9, 'ORDER_PLACED', 300, NULL, 6, 'success', '2026-10-20 16:36:15.007504');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (29, 5, 6, 'ORDER_ACCEPTED', 5175.56, 13, 5, 'success', '2026-10-20 16:36:15.126025');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (30, 5, 6, 'ORDER_FILLED', 5175.56, 13, 5, 'success', '2026-10-20 16:36:15.163796');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (31, 1, 1, 'deposit', 39632, 14, NULL, 'success', '2026-10-20 16:36:15.302962');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (32, 1, 1, 'ORDER_PLACED', 100, NULL, 7, 'success', '2026-10-20 16:36:15.394795');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (34, 3, 9, 'ORDER_ACCEPTED', 776.4, 15, 6, 'success', '2026-10-20 16:36:15.458525');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (35, 3, 9, 'ORDER_FILLED', 776.4, 15, 6, 'success', '2026-10-20 16:36:15.478065');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (36, 2, 8, 'deposit', 1606, 16, NULL, 'success', '2026-10-20 16:36:15.640517');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (37, 2, 8, 'withdraw', 1406, 17, NULL, 'success', '2026-10-20 16:36:15.729198');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (40, 3, 9, 'ORDER_PLACED', 100, NULL, 8, 'success', '2026-10-20 16:36:15.975572');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (41, 1, 1, 'ORDER_ACCEPTED', 258.8, 18, 7, 'success', '2026-10-20 16:36:15.762662');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (42, 1, 1, 'ORDER_FILLED', 258.8, 18, 7, 'success', '2026-10-20 16:36:15.810233');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (44, 3, 10, 'ORDER_PLACED', 100, NULL, 9, 'success', '2026-10-20 16:36:16.194778');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (45, 3, 9, 'ORDER_ACCEPTED', 258.74, 19, 8, 'success', '2026-10-20 16:36:16.178419');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (46, 3, 9, 'ORDER_FILLED', 258.74, 19, 8, 'success', '2026-10-20 16:36:16.212345');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (47, 3, 9, 'deposit', 1721, 20, NULL, 'success', '2026-10-20 16:36:16.457257');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (49, 3, 10, 'ORDER_ACCEPTED', 118.05, 21, 9, 'success', '2026-10-20 16:36:16.492312');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (50, 3, 10, 'ORDER_FILLED', 118.05, 21, 9, 'success', '2026-10-20 16:36:16.5445');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (51, 3, 10, 'ORDER_PLACED', 100, NULL, 10, 'success', '2026-10-20 16:36:16.689229');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (53, 3, 10, 'ORDER_ACCEPTED', 118.05, 22, 10, 'success', '2026-10-20 16:36:16.839756');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (54, 3, 10, 'ORDER_FILLED', 118.05, 22, 10, 'success', '2026-10-20 16:36:16.849279');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (55, 5, 6, 'ORDER_PLACED', 100, NULL, 11, 'success', '2026-10-20 16:36:16.989973');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (57, 5, 6, 'deposit', 1216, 23, NULL, 'success', '2026-10-20 16:36:17.127636');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (59, 5, 6, 'ORDER_ACCEPTED', 335.9, 24, 11, 'success', '2026-10-20 16:36:17.175201');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (60, 5, 6, 'ORDER_FILLED', 335.9, 24, 11, 'success', '2026-10-20 16:36:17.214192');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (61, 3, 9, 'ORDER_PLACED', 200, NULL, 12, 'success', '2026-10-20 16:36:17.380324');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (63, 1, 2, 'deposit', 2833, 25, NULL, 'success', '2026-10-20 16:36:17.526317');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (65, 3, 9, 'ORDER_ACCEPTED', 517.6, 26, 12, 'success', '2026-10-20 16:36:17.548807');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (66, 3, 9, 'ORDER_FILLED', 517.6, 26, 12, 'success', '2026-10-20 16:36:17.583379');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (67, 4, 4, 'ORDER_PLACED', 100, NULL, 13, 'success', '2026-10-20 16:36:17.773596');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (68, 1, 2, 'deposit', 3711, 27, NULL, 'success', '2026-10-20 16:36:17.908688');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (70, 4, 4, 'ORDER_ACCEPTED', 176.75, 28, 13, 'success', '2026-10-20 16:36:17.973778');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (71, 4, 4, 'ORDER_FILLED', 176.75, 28, 13, 'success', '2026-10-20 16:36:17.996285');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (72, 1, 1, 'ORDER_PLACED', 100, NULL, 14, 'success', '2026-10-20 16:36:18.164572');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (73, 3, 11, 'deposit', 3046, 29, NULL, 'success', '2026-10-20 16:36:18.308938');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (75, 1, 1, 'ORDER_ACCEPTED', 1294.15, 30, 14, 'success', '2026-10-20 16:36:18.403875');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (76, 1, 1, 'ORDER_FILLED', 1294.15, 30, 14, 'success', '2026-10-20 16:36:18.441649');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (77, 1, 2, 'ORDER_PLACED', 100, NULL, 15, 'success', '2026-10-20 16:36:18.542133');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (80, 1, 1, 'deposit', 3356, 32, NULL, 'success', '2026-10-20 16:36:18.707676');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (81, 1, 2, 'ORDER_ACCEPTED', 537.8, 31, 15, 'success', '2026-10-20 16:36:18.726156');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (82, 1, 2, 'ORDER_FILLED', 537.8, 31, 15, 'success', '2026-10-20 16:36:18.814214');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (83, 3, 10, 'ORDER_PLACED', 400, NULL, 16, 'success', '2026-10-20 16:36:19.004806');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (84, 3, 11, 'deposit', 1385, 33, NULL, 'success', '2026-10-20 16:36:19.203364');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (85, 1, 1, 'ORDER_PLACED', 100, NULL, 17, 'success', '2026-10-20 16:36:19.317723');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (87, 3, 10, 'ORDER_ACCEPTED', 2483.36, 34, 16, 'success', '2026-10-20 16:36:19.337287');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (88, 3, 10, 'ORDER_FILLED', 2483.36, 34, 16, 'success', '2026-10-20 16:36:19.371139');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (89, 3, 10, 'deposit', 3248, 35, NULL, 'success', '2026-10-20 16:36:19.54178');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (92, 3, 9, 'ORDER_PLACED', 400, NULL, 18, 'success', '2026-10-20 16:36:19.791188');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (93, 1, 1, 'ORDER_ACCEPTED', 1293.89, 36, 17, 'success', '2026-10-20 16:36:19.694711');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (94, 1, 1, 'ORDER_FILLED', 1293.89, 36, 17, 'success', '2026-10-20 16:36:19.744978');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (96, 3, 9, 'ORDER_ACCEPTED', 1034.96, 37, 18, 'success', '2026-10-20 16:36:19.980255');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (97, 3, 9, 'ORDER_FILLED', 1034.96, 37, 18, 'success', '2026-10-20 16:36:19.996538');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (98, 3, 12, 'deposit', 1777, 38, NULL, 'success', '2026-10-20 16:36:20.070349');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (99, 4, 4, 'ORDER_PLACED', 400, NULL, 19, 'success', '2026-10-20 16:36:20.190188');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (102, 4, 4, 'ORDER_ACCEPTED', 472.2, 39, 19, 'success', '2026-10-20 16:36:20.350044');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (103, 4, 4, 'ORDER_FILLED', 472.2, 39, 19, 'success', '2026-10-20 16:36:20.371243');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (104, 4, 4, 'ORDER_PLACED', 19602800, NULL, 20, 'success', '2026-10-20 16:36:20.413797');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (105, 4, 4, 'ORDER_REJECTED', 51520078.96, NULL, 20, 'failure', '2026-10-20 16:36:20.585216');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (106, 2, 8, 'deposit', 962, 40, NULL, 'success', '2026-10-20 16:36:20.643306');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (107, 2, 8, 'withdraw', 962, 41, NULL, 'success', '2026-10-20 16:36:20.686617');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (108, 3, 12, 'deposit', 55490, 42, NULL, 'success', '2026-10-20 16:36:20.859355');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (109, 3, 12, 'ORDER_PLACED', 300, NULL, 21, 'success', '2026-10-20 16:36:20.931669');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (111, 3, 12, 'ORDER_ACCEPTED', 2072.43, 43, 21, 'success', '2026-10-20 16:36:21.091203');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (112, 3, 12, 'ORDER_FILLED', 2072.43, 43, 21, 'success', '2026-10-20 16:36:21.102729');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (113, 4, 4, 'ORDER_PLACED', 400, NULL, 22, 'success', '2026-10-20 16:36:21.199982');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (116, 4, 4, 'ORDER_ACCEPTED', 633.4, 44, 22, 'success', '2026-10-20 16:36:21.358128');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (117, 4, 4, 'ORDER_FILLED', 633.4, 44, 22, 'success', '2026-10-20 16:36:21.397247');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (118, 4, 4, 'ORDER_PLACED', 400, NULL, 23, 'success', '2026-10-20 16:36:21.466412');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (119, 5, 7, 'deposit', 2397, 45, NULL, 'success', '2026-10-20 16:36:21.660415');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (121, 4, 4, 'ORDER_ACCEPTED', 5176.6, 46, 23, 'success', '2026-10-20 16:36:21.69622');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (122, 4, 4, 'ORDER_FILLED', 5176.6, 46, 23, 'success', '2026-10-20 16:36:21.734761');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (123, 3, 10, 'ORDER_PLACED', 300, NULL, 24, 'success', '2026-10-20 16:36:21.918524');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (124, 3, 10, 'deposit', 1175, 48, NULL, 'success', '2026-10-20 16:36:22.059167');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (126, 3, 10, 'ORDER_ACCEPTED', 1006.68, 47, 24, 'success', '2026-10-20 16:36:22.082344');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (127, 3, 10, 'ORDER_FILLED', 1006.68, 47, 24, 'success', '2026-10-20 16:36:22.119124');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (128, 4, 5, 'deposit', 20423, 49, NULL, 'success', '2026-10-20 16:36:22.259712');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (129, 4, 5, 'ORDER_PLACED', 200, NULL, 25, 'success', '2026-10-20 16:36:22.344345');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (130, 4, 5, 'ORDER_ACCEPTED', 2588.3, 50, 25, 'success', '2026-10-20 16:36:22.517996');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (131, 4, 5, 'ORDER_FILLED', 2588.3, 50, 25, 'success', '2026-10-20 16:36:22.522343');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (132, 1, 1, 'ORDER_PLACED', 400, NULL, 26, 'success', '2026-10-20 16:36:22.592409');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (133, 4, 4, 'ORDER_PLACED', 100, NULL, 27, 'success', '2026-10-20 16:36:22.735339');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (135, 1, 1, 'ORDER_ACCEPTED', 472.36, 51, 26, 'success', '2026-10-20 16:36:22.760684');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (136, 1, 1, 'ORDER_FILLED', 472.36, 51, 26, 'success', '2026-10-20 16:36:22.794185');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (137, 2, 8, 'deposit', 1304, 52, NULL, 'success', '2026-10-20 16:36:22.992071');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (140, 2, 8, 'withdraw', 1304, 54, NULL, 'success', '2026-10-20 16:36:23.034123');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (141, 4, 4, 'ORDER_ACCEPTED', 176.71, 53, 27, 'success', '2026-10-20 16:36:23.062113');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (142, 4, 4, 'ORDER_FILLED', 176.71, 53, 27, 'success', '2026-10-20 16:36:23.106562');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (143, 1, 3, 'deposit', 54737, 55, NULL, 'success', '2026-10-20 16:36:23.281981');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (144, 1, 3, 'ORDER_PLACED', 100, NULL, 28, 'success', '2026-10-20 16:36:23.351603');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (148, 1, 3, 'ORDER_ACCEPTED', 340.83, 56, 28, 'success', '2026-10-20 16:36:23.504864');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (149, 1, 3, 'ORDER_FILLED', 340.83, 56, 28, 'success', '2026-10-20 16:36:23.529021');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (150, 5, 7, 'withdraw', 1437, 57, NULL, 'success', '2026-10-20 16:36:23.570066');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (151, 3, 10, 'ORDER_PLACED', 100, NULL, 29, 'success', '2026-10-20 16:36:23.720206');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (152, 3, 10, 'ORDER_ACCEPTED', 335.44, 58, 29, 'success', '2026-10-20 16:36:23.874652');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (153, 3, 10, 'ORDER_FILLED', 335.44, 58, 29, 'success', '2026-10-20 16:36:23.89771');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (154, 3, 12, 'ORDER_PLACED', 300, NULL, 30, 'success', '2026-10-20 16:36:23.936325');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (156, 3, 12, 'ORDER_ACCEPTED', 2071.77, 59, 30, 'success', '2026-10-20 16:36:24.079641');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (157, 3, 12, 'ORDER_FILLED', 2071.77, 59, 30, 'success', '2026-10-20 16:36:24.08288');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (158, 1, 2, 'ORDER_PLACED', 100, NULL, 31, 'success', '2026-10-20 16:36:24.131221');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (160, 1, 2, 'ORDER_ACCEPTED', 341.54, 60, 31, 'success', '2026-10-20 16:36:24.255502');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (161, 1, 2, 'ORDER_FILLED', 341.54, 60, 31, 'success', '2026-10-20 16:36:24.268883');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (162, 5, 6, 'ORDER_PLACED', 200, NULL, 32, 'success', '2026-10-20 16:36:24.361464');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (165, 3, 9, 'deposit', 3890, 62, NULL, 'success', '2026-10-20 16:36:24.52764');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (166, 5, 6, 'ORDER_ACCEPTED', 675.62, 61, 32, 'success', '2026-10-20 16:36:24.543167');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (167, 5, 6, 'ORDER_FILLED', 675.62, 61, 32, 'success', '2026-10-20 16:36:24.592242');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (168, 3, 10, 'ORDER_PLACED', 400, NULL, 33, 'success', '2026-10-20 16:36:24.701266');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (169, 3, 10, 'ORDER_ACCEPTED', 2482.96, 63, 33, 'success', '2026-10-20 16:36:24.84412');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (170, 3, 10, 'ORDER_FILLED', 2482.96, 63, 33, 'success', '2026-10-20 16:36:24.851792');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (171, 1, 1, 'ORDER_PLACED', 300, NULL, 34, 'success', '2026-10-20 16:36:24.965794');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (173, 1, 1, 'ORDER_ACCEPTED', 1122.33, 64, 34, 'success', '2026-10-20 16:36:25.116946');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (174, 1, 1, 'ORDER_FILLED', 1122.33, 64, 34, 'success', '2026-10-20 16:36:25.137512');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (175, 1, 3, 'ORDER_PLACED', 18679000, NULL, 35, 'success', '2026-10-20 16:36:25.226921');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (176, 1, 3, 'ORDER_REJECTED', 115966703.6, NULL, 35, 'failure', '2026-10-20 16:36:25.354434');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (177, 3, 10, 'ORDER_PLACED', 100, NULL, 36, 'success', '2026-10-20 16:36:25.408657');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (179, 3, 10, 'ORDER_ACCEPTED', 335.44, 65, 36, 'success', '2026-10-20 16:36:25.534232');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (180, 3, 10, 'ORDER_FILLED', 335.44, 65, 36, 'success', '2026-10-20 16:36:25.554354');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (181, 5, 6, 'ORDER_PLACED', 400, NULL, 37, 'success', '2026-10-20 16:36:25.645772');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (183, 5, 6, 'ORDER_ACCEPTED', 868.4, 66, 37, 'success', '2026-10-20 16:36:25.824784');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (184, 5, 6, 'ORDER_FILLED', 868.4, 66, 37, 'success', '2026-10-20 16:36:25.836361');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (185, 3, 10, 'ORDER_PLACED', 100, NULL, 38, 'success', '2026-10-20 16:36:25.924826');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (187, 3, 10, 'ORDER_ACCEPTED', 132.36, 67, 38, 'success', '2026-10-20 16:36:26.073993');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (188, 3, 10, 'ORDER_FILLED', 132.36, 67, 38, 'success', '2026-10-20 16:36:26.081911');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (189, 4, 5, 'ORDER_PLACED', 400, NULL, 39, 'success', '2026-10-20 16:36:26.160217');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (191, 4, 5, 'ORDER_ACCEPTED', 1035.2, 68, 39, 'success', '2026-10-20 16:36:26.29709');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (192, 4, 5, 'ORDER_FILLED', 1035.2, 68, 39, 'success', '2026-10-20 16:36:26.321514');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (193, 2, 8, 'ORDER_PLACED', 12035100, NULL, 40, 'success', '2026-10-20 16:36:26.365985');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (194, 2, 8, 'ORDER_REJECTED', 40655771.31, NULL, 40, 'failure', '2026-10-20 16:36:26.511931');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (195, 1, 2, 'ORDER_PLACED', 14226000, NULL, 41, 'success', '2026-10-20 16:36:26.551258');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (196, 1, 2, 'ORDER_REJECTED', 48056850.6, NULL, 41, 'failure', '2026-10-20 16:36:26.671835');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (197, 4, 4, 'ORDER_PLACED', 100, NULL, 42, 'success', '2026-10-20 16:36:26.767129');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (198, 1, 3, 'ORDER_PLACED', 300, NULL, 43, 'success', '2026-10-20 16:36:27.01517');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (201, 4, 4, 'ORDER_ACCEPTED', 118.09, 69, 42, 'success', '2026-10-20 16:36:27.033837');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (202, 4, 4, 'ORDER_FILLED', 118.09, 69, 42, 'success', '2026-10-20 16:36:27.062607');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (203, 5, 6, 'ORDER_PLACED', 400, NULL, 44, 'success', '2026-10-20 16:36:27.215992');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (207, 1, 3, 'ORDER_ACCEPTED', 776.4, 70, 43, 'success', '2026-10-20 16:36:27.259535');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (208, 1, 3, 'ORDER_FILLED', 776.4, 70, 43, 'success', '2026-10-20 16:36:27.301635');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (209, 5, 7, 'deposit', 58851, 71, NULL, 'success', '2026-10-20 16:36:27.43958');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (210, 5, 6, 'ORDER_ACCEPTED', 868.16, 72, 44, 'success', '2026-10-20 16:36:27.538096');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (211, 5, 7, 'ORDER_PLACED', 200, NULL, 45, 'success', '2026-10-20 16:36:27.548564');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (212, 5, 6, 'ORDER_FILLED', 868.16, 72, 44, 'success', '2026-10-20 16:36:27.553459');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (213, 5, 7, 'ORDER_ACCEPTED', 671.12, 73, 45, 'success', '2026-10-20 16:36:27.764485');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (214, 3, 12, 'deposit', 1891, 74, NULL, 'success', '2026-10-20 16:36:27.77808');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (215, 5, 7, 'ORDER_FILLED', 671.12, 73, 45, 'success', '2026-10-20 16:36:27.778521');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (216, 3, 9, 'ORDER_PLACED', 17135400, NULL, 46, 'success', '2026-10-20 16:36:27.999287');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (217, 1, 2, 'ORDER_PLACED', 14263600, NULL, 47, 'success', '2026-10-20 16:36:28.164865');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (218, 3, 9, 'ORDER_REJECTED', 72251414.1, NULL, 46, 'failure', '2026-10-20 16:36:28.293755');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (219, 1, 3, 'ORDER_PLACED', 400, NULL, 48, 'success', '2026-10-20 16:36:28.355767');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (220, 1, 2, 'ORDER_REJECTED', 75906600.11, NULL, 47, 'failure', '2026-10-20 16:36:28.430167');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (221, 3, 10, 'ORDER_PLACED', 300, NULL, 49, 'success', '2026-10-20 16:36:28.557512');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (224, 1, 3, 'ORDER_ACCEPTED', 5176.6, 75, 48, 'success', '2026-10-20 16:36:28.608847');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (225, 1, 3, 'ORDER_FILLED', 5176.6, 75, 48, 'success', '2026-10-20 16:36:28.622864');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (226, 3, 9, 'deposit', 954, 76, NULL, 'success', '2026-10-20 16:36:28.722644');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (228, 3, 10, 'ORDER_ACCEPTED', 1007.69, 77, 49, 'success', '2026-10-20 16:36:28.817075');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (229, 3, 10, 'ORDER_FILLED', 1007.69, 77, 49, 'success', '2026-10-20 16:36:28.829058');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (230, 4, 5, 'ORDER_PLACED', 100, NULL, 50, 'success', '2026-10-20 16:36:28.927928');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (232, 4, 5, 'ORDER_ACCEPTED', 341.62, 78, 50, 'success', '2026-10-20 16:36:29.09948');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (233, 4, 5, 'ORDER_FILLED', 341.62, 78, 50, 'success', '2026-10-20 16:36:29.129067');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (234, 1, 1, 'withdraw', 1375, 79, NULL, 'success', '2026-10-20 16:36:29.180197');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (235, 1, 3, 'ORDER_PLACED', 300, NULL, 51, 'success', '2026-10-20 16:36:29.285975');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (237, 1, 3, 'ORDER_ACCEPTED', 776.22, 80, 51, 'success', '2026-10-20 16:36:29.448335');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (238, 1, 3, 'ORDER_FILLED', 776.22, 80, 51, 'success', '2026-10-20 16:36:29.457237');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (239, 3, 9, 'ORDER_PLACED', 300, NULL, 52, 'success', '2026-10-20 16:36:29.529672');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (240, 1, 1, 'ORDER_PLACED', 300, NULL, 53, 'success', '2026-10-20 16:36:29.669435');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (242, 3, 9, 'ORDER_ACCEPTED', 1862.52, 81, 52, 'success', '2026-10-20 16:36:29.70587');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (243, 3, 9, 'ORDER_FILLED', 1862.52, 81, 52, 'success', '2026-10-20 16:36:29.734534');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (244, 1, 1, 'deposit', 3998, 82, NULL, 'success', '2026-10-20 16:36:29.847619');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (246, 1, 1, 'ORDER_ACCEPTED', 1121.94, 83, 53, 'success', '2026-10-20 16:36:29.890505');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (247, 1, 1, 'ORDER_FILLED', 1121.94, 83, 53, 'success', '2026-10-20 16:36:29.905625');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (248, 3, 9, 'ORDER_PLACED', 100, NULL, 54, 'success', '2026-10-20 16:36:30.056613');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (251, 3, 9, 'ORDER_ACCEPTED', 620.84, 84, 54, 'success', '2026-10-20 16:36:30.196818');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (252, 3, 9, 'ORDER_FILLED', 620.84, 84, 54, 'success', '2026-10-20 16:36:30.216225');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (253, 3, 9, 'ORDER_PLACED', 100, NULL, 55, 'success', '2026-10-20 16:36:30.285903');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (255, 3, 11, 'withdraw', 1257, 86, NULL, 'success', '2026-10-20 16:36:30.491264');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (256, 3, 9, 'ORDER_ACCEPTED', 532.17, 85, 55, 'success', '2026-10-20 16:36:30.45348');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (257, 3, 9, 'ORDER_FILLED', 532.17, 85, 55, 'success', '2026-10-20 16:36:30.465094');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (258, 5, 6, 'ORDER_PLACED', 300, NULL, 56, 'success', '2026-10-20 16:36:30.659413');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (261, 4, 5, 'deposit', 1542, 87, NULL, 'success', '2026-10-20 16:36:30.784628');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (262, 5, 6, 'ORDER_ACCEPTED', 1122.33, 88, 56, 'success', '2026-10-20 16:36:30.815488');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (263, 5, 6, 'ORDER_FILLED', 1122.33, 88, 56, 'success', '2026-10-20 16:36:30.839665');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (264, 4, 5, 'ORDER_PLACED', 100, NULL, 57, 'success', '2026-10-20 16:36:30.954806');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (267, 3, 10, 'ORDER_PLACED', 400, NULL, 58, 'success', '2026-10-20 16:36:31.230482');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (268, 4, 5, 'ORDER_ACCEPTED', 341.54, 89, 57, 'success', '2026-10-20 16:36:31.076425');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (269, 4, 5, 'ORDER_FILLED', 341.54, 89, 57, 'success', '2026-10-20 16:36:31.095424');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (271, 3, 10, 'ORDER_ACCEPTED', 2763.24, 90, 58, 'success', '2026-10-20 16:36:31.399409');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (272, 3, 10, 'ORDER_FILLED', 2763.24, 90, 58, 'success', '2026-10-20 16:36:31.40602');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (273, 3, 9, 'ORDER_PLACED', 300, NULL, 59, 'success', '2026-10-20 16:36:31.472513');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (275, 3, 9, 'ORDER_ACCEPTED', 1596.5, 91, 59, 'success', '2026-10-20 16:36:31.615733');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (276, 3, 9, 'ORDER_FILLED', 1596.5, 91, 59, 'success', '2026-10-20 16:36:31.620018');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (278, 2, 8, 'deposit', 20892, 92, NULL, 'success', '2026-10-20 16:36:31.680939');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (279, 2, 8, 'ORDER_PLACED', 400, NULL, 60, 'success', '2026-10-20 16:36:31.789745');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (281, 2, 8, 'ORDER_ACCEPTED', 1035.2, 93, 60, 'success', '2026-10-20 16:36:31.959577');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (282, 2, 8, 'ORDER_FILLED', 1035.2, 93, 60, 'success', '2026-10-20 16:36:31.977088');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (283, 3, 11, 'deposit', 27294, 94, NULL, 'success', '2026-10-20 16:36:32.070508');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (284, 3, 11, 'ORDER_PLACED', 300, NULL, 61, 'success', '2026-10-20 16:36:32.186385');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (286, 3, 11, 'ORDER_ACCEPTED', 1006.68, 95, 61, 'success', '2026-10-20 16:36:32.399015');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (287, 3, 11, 'ORDER_FILLED', 1006.68, 95, 61, 'success', '2026-10-20 16:36:32.412582');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (288, 3, 11, 'ORDER_PLACED', 100, NULL, 62, 'success', '2026-10-20 16:36:32.544793');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (290, 3, 11, 'ORDER_ACCEPTED', 262.82, 96, 62, 'success', '2026-10-20 16:36:32.705391');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (291, 3, 11, 'ORDER_FILLED', 262.82, 96, 62, 'success', '2026-10-20 16:36:32.72107');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (292, 4, 4, 'deposit', 1495, 97, NULL, 'success', '2026-10-20 16:36:32.837594');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (293, 1, 2, 'ORDER_PLACED', 300, NULL, 63, 'success', '2026-10-20 16:36:33.024205');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (296, 2, 8, 'deposit', 2128, 98, NULL, 'success', '2026-10-20 16:36:33.166896');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (297, 1, 2, 'ORDER_ACCEPTED', 2072.43, 99, 63, 'success', '2026-10-20 16:36:33.196189');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (298, 1, 2, 'ORDER_FILLED', 2072.43, 99, 63, 'success', '2026-10-20 16:36:33.209286');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (299, 3, 12, 'ORDER_PLACED', 200, NULL, 64, 'success', '2026-10-20 16:36:33.367573');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (301, 3, 12, 'ORDER_ACCEPTED', 264.72, 100, 64, 'success', '2026-10-20 16:36:33.474552');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (302, 3, 12, 'ORDER_FILLED', 264.72, 100, 64, 'success', '2026-10-20 16:36:33.480046');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (303, 5, 7, 'ORDER_PLACED', 200, NULL, 65, 'success', '2026-10-20 16:36:33.605011');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (304, 4, 5, 'deposit', 3697, 101, NULL, 'success', '2026-10-20 16:36:33.738632');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (306, 5, 7, 'ORDER_ACCEPTED', 670.88, 102, 65, 'success', '2026-10-20 16:36:33.767319');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (307, 5, 7, 'ORDER_FILLED', 670.88, 102, 65, 'success', '2026-10-20 16:36:33.786353');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (308, 1, 3, 'ORDER_PLACED', 400, NULL, 66, 'success', '2026-10-20 16:36:33.910977');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (311, 1, 3, 'ORDER_ACCEPTED', 529.44, 103, 66, 'success', '2026-10-20 16:36:34.056401');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (312, 1, 3, 'ORDER_FILLED', 529.44, 103, 66, 'success', '2026-10-20 16:36:34.071594');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (313, 1, 2, 'ORDER_PLACED', 300, NULL, 67, 'success', '2026-10-20 16:36:34.154086');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (316, 2, 8, 'ORDER_PLACED', 200, NULL, 68, 'success', '2026-10-20 16:36:34.424416');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (317, 1, 2, 'ORDER_ACCEPTED', 1862.52, 104, 67, 'success', '2026-10-20 16:36:34.306636');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (318, 1, 2, 'ORDER_FILLED', 1862.52, 104, 67, 'success', '2026-10-20 16:36:34.330222');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (320, 1, 2, 'ORDER_PLACED', 200, NULL, 69, 'success', '2026-10-20 16:36:34.595983');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (321, 2, 8, 'ORDER_ACCEPTED', 525.64, 105, 68, 'success', '2026-10-20 16:36:34.580259');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (322, 2, 8, 'ORDER_FILLED', 525.64, 105, 68, 'success', '2026-10-20 16:36:34.596494');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (323, 1, 2, 'ORDER_ACCEPTED', 683.24, 106, 69, 'success', '2026-10-20 16:36:34.784809');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (324, 1, 2, 'ORDER_FILLED', 683.24, 106, 69, 'success', '2026-10-20 16:36:34.790246');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (325, 5, 7, 'ORDER_PLACED', 400, NULL, 70, 'success', '2026-10-20 16:36:34.799713');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (327, 1, 2, 'ORDER_PLACED', 200, NULL, 71, 'success', '2026-10-20 16:36:34.995935');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (328, 5, 7, 'ORDER_ACCEPTED', 1496.44, 107, 70, 'success', '2026-10-20 16:36:34.957566');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (329, 5, 7, 'ORDER_FILLED', 1496.44, 107, 70, 'success', '2026-10-20 16:36:34.990891');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (330, 1, 3, 'ORDER_PLACED', 200, NULL, 72, 'success', '2026-10-20 16:36:35.203528');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (332, 1, 2, 'ORDER_ACCEPTED', 525.64, 108, 71, 'success', '2026-10-20 16:36:35.369079');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (333, 1, 2, 'ORDER_FILLED', 525.64, 108, 71, 'success', '2026-10-20 16:36:35.380079');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (334, 1, 2, 'ORDER_PLACED', 100, NULL, 73, 'success', '2026-10-20 16:36:35.398771');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (335, 1, 3, 'deposit', 3604, 109, NULL, 'success', '2026-10-20 16:36:35.523086');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (337, 1, 3, 'ORDER_ACCEPTED', 353.5, 110, 72, 'success', '2026-10-20 16:36:35.559555');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (338, 1, 3, 'ORDER_FILLED', 353.5, 110, 72, 'success', '2026-10-20 16:36:35.581758');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (339, 3, 10, 'ORDER_PLACED', 200, NULL, 74, 'success', '2026-10-20 16:36:35.695732');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (342, 3, 10, 'ORDER_PLACED', 200, NULL, 75, 'success', '2026-10-20 16:36:35.903138');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (343, 1, 2, 'ORDER_ACCEPTED', 690.81, 111, 73, 'success', '2026-10-20 16:36:35.746576');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (344, 1, 2, 'ORDER_FILLED', 690.81, 111, 73, 'success', '2026-10-20 16:36:35.767558');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (347, 3, 10, 'ORDER_ACCEPTED', 671.8, 112, 74, 'success', '2026-10-20 16:36:35.969508');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (348, 3, 10, 'ORDER_FILLED', 671.8, 112, 74, 'success', '2026-10-20 16:36:36.001172');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (349, 3, 10, 'ORDER_ACCEPTED', 434.2, 113, 75, 'success', '2026-10-20 16:36:36.159903');
INSERT INTO public.transaction_logs (log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at) VALUES (350, 3, 10, 'ORDER_FILLED', 434.2, 113, 75, 'success', '2026-10-20 16:36:36.165297');


--
-- Data for Name: user_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (1, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'SIGNUP', 'success', '2026-10-20 16:36:09.091584');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (2, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'SIGNUP', 'success', '2026-10-20 16:36:09.202414');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (3, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'SIGNUP', 'success', '2026-10-20 16:36:09.241279');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (4, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'SIGNUP', 'success', '2026-10-20 16:36:09.382091');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (5, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'SIGNUP', 'success', '2026-10-20 16:36:09.528882');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (6, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:09.725283');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (7, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:09.856274');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (8, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:09.978973');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (9, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:10.090167');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (10, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:10.201021');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (11, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'CHANGE_PASSWORD', 'success', '2026-10-20 16:36:36.690725');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (12, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'CHANGE_PASSWORD', 'success', '2026-10-20 16:36:36.867274');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (13, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'CHANGE_PASSWORD', 'success', '2026-10-20 16:36:37.043027');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (14, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'CHANGE_PASSWORD', 'success', '2026-10-20 16:36:37.220713');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (15, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'CHANGE_PASSWORD', 'success', '2026-10-20 16:36:37.390046');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (16, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'failure', '2026-10-20 16:36:37.50439');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (17, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'failure', '2026-10-20 16:36:37.611444');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (18, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'failure', '2026-10-20 16:36:37.696381');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (19, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'failure', '2026-10-20 16:36:37.801853');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (20, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'failure', '2026-10-20 16:36:37.896693');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (21, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.020255');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (22, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.124232');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (23, 1, 'u2_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.228439');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (24, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.334581');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (25, 3, 'u1_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.451899');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (26, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.556537');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (27, 5, 'u4_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.661473');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (28, 4, 'u3_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.766548');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (29, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.87196');
INSERT INTO public.user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES (30, 2, 'u5_1792514168', '::ffff:172.25.0.1', 'LOGIN', 'success', '2026-10-20 16:36:38.9827');


--
-- Name: account_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_transactions_transaction_id_seq', 113, true);


--
-- Name: accounts_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_account_id_seq', 12, true);


--
-- Name: instruments_instrument_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instruments_instrument_id_seq', 99, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 75, true);


--
-- Name: portfolio_snapshots_snapshot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portfolio_snapshots_snapshot_id_seq', 1, false);


--
-- Name: transaction_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transaction_logs_log_id_seq', 350, true);


--
-- Name: user_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_logs_log_id_seq', 30, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict bnIS2Nk3vecCvb1Z3zioSqJ6d9z92pxzcwjCiCFLNui8mBn4t1JpQ7GwZuIEcL6

