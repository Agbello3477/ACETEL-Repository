--
-- PostgreSQL database dump
--

\restrict f8KUgHypYrd7fNet3fptvAFxUoJvRQ1ySndj4yYy6En51qHwmpPOGYLCCpJ5Pd1

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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
-- Name: degree_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.degree_type AS ENUM (
    'MSc',
    'PhD'
);


ALTER TYPE public.degree_type OWNER TO admin;

--
-- Name: programme_name; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.programme_name AS ENUM (
    'Artificial Intelligence',
    'Cyber Security',
    'Management Information System'
);


ALTER TYPE public.programme_name OWNER TO admin;

--
-- Name: thesis_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.thesis_status AS ENUM (
    'Draft',
    'Submitted',
    'Approved',
    'Locked'
);


ALTER TYPE public.thesis_status OWNER TO admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.user_role AS ENUM (
    'Super Admin',
    'Centre Admin',
    'Student',
    'Reviewer'
);


ALTER TYPE public.user_role OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100),
    target_id integer,
    ip_address character varying(45),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO admin;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- Name: theses; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.theses (
    thesis_id integer NOT NULL,
    author_id integer,
    title text NOT NULL,
    abstract text,
    keywords text[],
    supervisor_name character varying(255),
    programme public.programme_name NOT NULL,
    degree public.degree_type NOT NULL,
    graduation_year integer NOT NULL,
    pdf_url text,
    file_hash text,
    status public.thesis_status DEFAULT 'Draft'::public.thesis_status,
    is_legacy boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.theses OWNER TO admin;

--
-- Name: theses_thesis_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.theses_thesis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.theses_thesis_id_seq OWNER TO admin;

--
-- Name: theses_thesis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.theses_thesis_id_seq OWNED BY public.theses.thesis_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    matric_number character varying(50),
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'Student'::public.user_role,
    programme public.programme_name,
    degree public.degree_type,
    staff_id character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: theses thesis_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.theses ALTER COLUMN thesis_id SET DEFAULT nextval('public.theses_thesis_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.audit_logs (log_id, user_id, action, target_id, ip_address, "timestamp") FROM stdin;
\.


--
-- Data for Name: theses; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.theses (thesis_id, author_id, title, abstract, keywords, supervisor_name, programme, degree, graduation_year, pdf_url, file_hash, status, is_legacy, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, matric_number, full_name, email, password_hash, role, programme, degree, staff_id, is_active, created_at) FROM stdin;
1	NOUN12345	Test User 2	test2@noun.edu.ng	$2b$10$.YgtMr8oqEl3g.98Z92BUujnj.cRiqQQjVzdVg3n2mtoaVyYvUtOi	Student	Artificial Intelligence	MSc	\N	t	2026-02-03 17:31:45.965273+00
2	\N	Admin User	admin@noun.edu.ng	$2b$10$S7oyywmePouDgnnS3O/sXuUSgIfnchOwJYpM2gAty0Y2PyPbT1GWG	Centre Admin	\N	\N	12345	t	2026-02-03 17:36:01.780658+00
3	\N	manager	manager@noun.edu.ng	$2b$10$fp4BRo4A3rSP4avp.B4y1eq2wZSO6c1/6Zj74NjSfamxmvyaMuTZ6	Super Admin	\N	MSc	01234	t	2026-02-03 18:09:51.46621+00
4	ACE12345679	Soffy	soffy@noun.edu.ng	$2b$10$ba2r477gS9t.Ha5UIBbZROXyI.0N/lPXcfj/iUOkeyDJE6GavIM5K	Student	Cyber Security	PhD	\N	t	2026-02-03 18:16:51.124792+00
\.


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 1, false);


--
-- Name: theses_thesis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.theses_thesis_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 4, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: theses theses_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.theses
    ADD CONSTRAINT theses_pkey PRIMARY KEY (thesis_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_matric_number_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_matric_number_key UNIQUE (matric_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_programme_degree; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_programme_degree ON public.theses USING btree (programme, degree);


--
-- Name: idx_thesis_search; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_thesis_search ON public.theses USING gin (to_tsvector('english'::regconfig, ((title || ' '::text) || abstract)));


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: theses theses_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.theses
    ADD CONSTRAINT theses_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict f8KUgHypYrd7fNet3fptvAFxUoJvRQ1ySndj4yYy6En51qHwmpPOGYLCCpJ5Pd1

