import { WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function OfflinePage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                        <WifiOff className="size-6 text-muted-foreground" />
                    </div>
                    <CardTitle>You're Offline</CardTitle>
                    <CardDescription>
                        It looks like you've lost your internet connection.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-balance text-muted-foreground">
                        ShiftWise requires an active connection to sync your latest shifts and earnings. Please check your network and try again.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
