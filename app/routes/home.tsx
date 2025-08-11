import type { Route } from "./+types/home";
import { redirect } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader() {
  return redirect("/chat");
}

export default function Home() {
  return null;
}
