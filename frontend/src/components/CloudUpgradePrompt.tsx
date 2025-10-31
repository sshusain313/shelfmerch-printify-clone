import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Zap, Shield, Users } from 'lucide-react';

export const CloudUpgradePrompt = () => {
  return (
    <Card className="p-6 border-primary/50 bg-primary/5">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            Upgrade to ShelfMerch Cloud for Real-Time Features
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Currently using localStorage (limited to ~5MB). Upgrade to unlock:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span>Real-time data sync across devices</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-primary" />
              <span>Unlimited storage for products</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure authentication & user profiles</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>Customer order management</span>
            </div>
          </div>
          <Button size="sm" className="mt-2">
            Enable ShelfMerch Cloud (Free to Start)
          </Button>
        </div>
      </div>
    </Card>
  );
};
