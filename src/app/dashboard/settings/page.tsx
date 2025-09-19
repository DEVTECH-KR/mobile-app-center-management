import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_CENTER_INFO, MOCK_USERS } from "@/lib/mock-data";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// In a real app, this would come from an auth context
const userRole = MOCK_USERS.admin.role;

export default function SettingsPage() {
    if (userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline tracking-tight">
          Center Information
        </h2>
        <p className="text-muted-foreground">
          Manage general information about the training center.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update mission statement, schedule, and fees.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mission">Mission Statement</Label>
              <Textarea id="mission" defaultValue={MOCK_CENTER_INFO.mission} rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input id="schedule" defaultValue={MOCK_CENTER_INFO.schedule} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-fee">Registration Fee (FBU)</Label>
              <Input id="registration-fee" type="number" defaultValue={MOCK_CENTER_INFO.registrationFee} />
            </div>
            <div className="flex justify-end">
                <Button>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
