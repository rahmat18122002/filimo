CREATE OR REPLACE FUNCTION private.current_device_id()
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(current_setting('request.headers', true)::json ->> 'x-device-id', '');
$$;