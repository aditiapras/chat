import { Outlet, useLocation } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { LoaderPinwheel, SlidersHorizontal, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { ArrowLeft } from 'lucide-react';


export default function SettingsLayout() {
    const location = useLocation()

    return (
        <div className="w-full min-h-screen bg-background p-4">
            <Link to="/chat"><Button variant="ghost" size="sm"><ArrowLeft /> Back to Chat</Button></Link>
            <div className="w-full 2xl:max-w-4xl lg:max-w-3xl mx-auto flex flex-col h-full px-5 md:px-0">
                <p className="text-2xl font-bold my-4">Settings</p>
                <Tabs defaultValue={location.pathname.split("/").pop()} className="text-sm text-muted-foreground">
                    <TabsList variant="line">
                        <Link to="/settings">
                            <TabsTrigger value="settings">
                                <UserRound /> Profile
                            </TabsTrigger>
                        </Link>
                        <Link to="/settings/customize">
                            <TabsTrigger value="customize">
                                <SlidersHorizontal /> Customization
                            </TabsTrigger>
                        </Link>
                        <Link to="/settings/models">
                            <TabsTrigger value="models">
                                <LoaderPinwheel />
                                Models
                            </TabsTrigger>
                        </Link>
                    </TabsList>
                    <TabsContent value="settings"><Outlet /></TabsContent>
                    <TabsContent value="customize"><Outlet /></TabsContent>
                    <TabsContent value="models"><Outlet /></TabsContent>
                </Tabs>
            </div>
        </div >)
}
