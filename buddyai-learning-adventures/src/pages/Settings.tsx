import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [grade, setGrade] = useState(user?.grade || "Standard 9");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setGrade(user.grade || "Standard 9");
    }
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({ name, grade });
      toast.success("Saved ✓");
    } catch (err) {
      toast.error("Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild size="icon" variant="ghost" className="rounded-full">
            <Link to="/home"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-display text-3xl text-primary-deep">My Profile</h1>
        </div>

        <Card className="p-6 border-0 shadow-card">
          <div className="space-y-5">
            <div>
              <Label className="font-bold">Your name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="font-bold">Grade</Label>
              <select
                value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Standard 9">Standard 9</option>
                <option value="Standard 10">Standard 10</option>
              </select>
            </div>
            <Button onClick={save} disabled={saving} className="w-full rounded-full font-extrabold">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}