import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultHomeForRole, isRouteAllowedForRole } from "../src/lib/route-guard";

test("getDefaultHomeForRole returns each role's dedicated dashboard", () => {
  assert.equal(getDefaultHomeForRole("Foreman"), "/");
  assert.equal(getDefaultHomeForRole("Director"), "/director");
  assert.equal(getDefaultHomeForRole("Management"), "/management");
  assert.equal(getDefaultHomeForRole("Employee"), "/employee");
});

test("Foreman sees only Foreman dashboard and operational routes", () => {
  assert.equal(isRouteAllowedForRole("/", "Foreman"), true);
  assert.equal(isRouteAllowedForRole("/registration", "Foreman"), true);
  assert.equal(isRouteAllowedForRole("/job-cards", "Foreman"), true);

  assert.equal(isRouteAllowedForRole("/director", "Foreman"), false);
  assert.equal(isRouteAllowedForRole("/management", "Foreman"), false);
  assert.equal(isRouteAllowedForRole("/employee", "Foreman"), false);
  assert.equal(isRouteAllowedForRole("/approvals", "Foreman"), false);
  assert.equal(isRouteAllowedForRole("/departments", "Foreman"), false);
  assert.equal(isRouteAllowedForRole("/workflow", "Foreman"), false);
});

test("Director and Management share capabilities while isolated to their own dashboard", () => {
  assert.equal(isRouteAllowedForRole("/director", "Director"), true);
  assert.equal(isRouteAllowedForRole("/management", "Director"), false);
  assert.equal(isRouteAllowedForRole("/", "Director"), false);
  assert.equal(isRouteAllowedForRole("/employee", "Director"), false);
  assert.equal(isRouteAllowedForRole("/registration", "Director"), false);
  assert.equal(isRouteAllowedForRole("/approvals", "Director"), true);
  assert.equal(isRouteAllowedForRole("/procurement", "Director"), true);
  assert.equal(isRouteAllowedForRole("/departments", "Director"), true);

  assert.equal(isRouteAllowedForRole("/management", "Management"), true);
  assert.equal(isRouteAllowedForRole("/director", "Management"), false);
  assert.equal(isRouteAllowedForRole("/", "Management"), false);
  assert.equal(isRouteAllowedForRole("/employee", "Management"), false);
  assert.equal(isRouteAllowedForRole("/registration", "Management"), false);
  assert.equal(isRouteAllowedForRole("/approvals", "Management"), true);
  assert.equal(isRouteAllowedForRole("/procurement", "Management"), true);
  assert.equal(isRouteAllowedForRole("/departments", "Management"), true);
});

test("Employee sees only Employee dashboard and floor job/parts/workshop routes", () => {
  assert.equal(isRouteAllowedForRole("/employee", "Employee"), true);
  assert.equal(isRouteAllowedForRole("/job-cards", "Employee"), true);
  assert.equal(isRouteAllowedForRole("/requisitions", "Employee"), true);
  assert.equal(isRouteAllowedForRole("/workshop", "Employee"), true);

  assert.equal(isRouteAllowedForRole("/", "Employee"), false);
  assert.equal(isRouteAllowedForRole("/director", "Employee"), false);
  assert.equal(isRouteAllowedForRole("/management", "Employee"), false);
  assert.equal(isRouteAllowedForRole("/approvals", "Employee"), false);
  assert.equal(isRouteAllowedForRole("/registration", "Employee"), false);
  assert.equal(isRouteAllowedForRole("/vehicles", "Employee"), false);
});
