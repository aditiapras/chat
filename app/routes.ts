import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/chat/layout.tsx", [
    route("chat", "routes/chat/index.tsx"),
    route("chat/:id", "routes/chat/id.tsx"),
  ]),
  layout("routes/settings/layout.tsx", [
    route("settings", "routes/settings/index.tsx"),
    route("settings/models", "routes/settings/models.tsx"),
    route("settings/customize", "routes/settings/customize.tsx"),
  ]),
  route("api/webhook", "routes/api/webhook.ts"),
  route("api/chat", "routes/api/chat.ts"),
  route("api/thread", "routes/api/thread.ts"),
  route("api/generate-title", "routes/api/generate-title.ts"),
  route("sign-in/*", "routes/auth/sign-in.tsx"),
  route("sign-up/*", "routes/auth/sign-up.tsx"),
] satisfies RouteConfig;
