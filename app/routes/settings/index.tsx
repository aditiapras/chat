import type { Route } from "./+types/index"
import { TabsContent } from "~/components/ui/tabs"

export const meta: Route.MetaFunction = ({ }) => {
    return [
        {
            title: "Settings",
            description: "Settings page",
        },
    ];
}

export default function Page() {
    return (
        <div>

        </div>
    )
}
