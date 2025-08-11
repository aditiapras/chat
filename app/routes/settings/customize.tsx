import type { Route } from "./+types/customize"

export const meta: Route.MetaFunction = ({ }) => {
    return [
        {
            title: "Customize",
            description: "Customize page",
        },
    ];
}

export default function Page() {
    return (
        <div>
            <p>Customize</p>
        </div>
    )
}
