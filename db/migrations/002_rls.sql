-- Session variables set by the application per request:
--   SET LOCAL app.tenant_id = '<uuid>'
--   SET LOCAL app.user_id   = '<uuid>'

CREATE OR REPLACE FUNCTION app_current_tenant_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

-- SECURITY DEFINER helpers to avoid RLS recursion in policies

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET row_security = off
SET search_path = public AS $$
  SELECT role
  FROM memberships
  WHERE tenant_id = app_current_tenant_id()
    AND user_id = app_current_user_id()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION app_current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_current_role() TO app_user;

CREATE OR REPLACE FUNCTION app_tenant_has_members(tid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET row_security = off
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM memberships WHERE tenant_id = tid
  );
$$;

REVOKE ALL ON FUNCTION app_tenant_has_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_tenant_has_members(uuid) TO app_user;

CREATE OR REPLACE FUNCTION app_is_member() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET row_security = off
SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM memberships
    WHERE tenant_id = app_current_tenant_id()
      AND user_id = app_current_user_id()
  );
$$;

REVOKE ALL ON FUNCTION app_is_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_is_member() TO app_user;

-- RLS: memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memberships_select ON memberships;
DROP POLICY IF EXISTS memberships_insert ON memberships;
DROP POLICY IF EXISTS memberships_update ON memberships;
DROP POLICY IF EXISTS memberships_delete ON memberships;

-- Members can see their own membership row; admins/owners can see all members
CREATE POLICY memberships_select ON memberships
FOR SELECT
USING (
  tenant_id = app_current_tenant_id()
  AND (
    user_id = app_current_user_id()
    OR app_current_role() IN ('owner','admin')
  )
);

-- Bootstrapping: allow the *first* membership row for a new tenant
-- Also allow owners to manage memberships later
CREATE POLICY memberships_insert ON memberships
FOR INSERT
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND (
    app_current_role() = 'owner'
    OR (
      user_id = app_current_user_id()
      AND NOT app_tenant_has_members(app_current_tenant_id())
    )
  )
);

CREATE POLICY memberships_update ON memberships
FOR UPDATE
USING (
  tenant_id = app_current_tenant_id()
  AND app_current_role() = 'owner'
)
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND app_current_role() = 'owner'
);

CREATE POLICY memberships_delete ON memberships
FOR DELETE
USING (
  tenant_id = app_current_tenant_id()
  AND app_current_role() = 'owner'
);

-- RLS: notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_select ON notes;
DROP POLICY IF EXISTS notes_insert ON notes;
DROP POLICY IF EXISTS notes_update ON notes;
DROP POLICY IF EXISTS notes_delete ON notes;

CREATE POLICY notes_select ON notes
FOR SELECT
USING (
  tenant_id = app_current_tenant_id()
  AND app_is_member()
);

CREATE POLICY notes_insert ON notes
FOR INSERT
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND owner_user_id = app_current_user_id()
  AND app_is_member()
);

CREATE POLICY notes_update ON notes
FOR UPDATE
USING (
  tenant_id = app_current_tenant_id()
  AND app_is_member()
  AND (
    owner_user_id = app_current_user_id()
    OR app_current_role() IN ('owner','admin')
  )
)
WITH CHECK (
  tenant_id = app_current_tenant_id()
  AND app_is_member()
  AND (
    owner_user_id = app_current_user_id()
    OR app_current_role() IN ('owner','admin')
  )
);

CREATE POLICY notes_delete ON notes
FOR DELETE
USING (
  tenant_id = app_current_tenant_id()
  AND app_is_member()
  AND (
    owner_user_id = app_current_user_id()
    OR app_current_role() IN ('owner','admin')
  )
);
