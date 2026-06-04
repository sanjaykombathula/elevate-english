REVOKE ALL ON FUNCTION public.submit_assessment(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_assessment(uuid, jsonb) TO authenticated;