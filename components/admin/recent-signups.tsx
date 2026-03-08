
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface RecentSignupsProps {
    users: any[]
}

export function RecentSignups({ users }: RecentSignupsProps) {
    return (
        <div className="space-y-8">
            {users.map((user) => (
                <div key={user.id} className="flex items-center">
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                        <Badge variant={user.isPremium ? "default" : "secondary"} className="text-[10px] px-1.5 h-4">
                            {user.isPremium ? "Premium" : "Free"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
            {users.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">No recent signups</p>
            )}
        </div>
    )
}
