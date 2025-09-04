# Lucide React Icons Guide for MomentMoi

## 🎯 Most Useful Icons for Event Planning

### 💍 Events & Romance

- `Heart` - Love, favorites, romantic elements
- `Sparkles` - Special moments, celebrations, magic
- `Gift` - Event gifts, registry
- `Camera` - Photography, memories
- `Flower` - Bouquets, decorations (if available)
- `Star` - Favorites, special moments

### 📅 Planning & Organization

- `Calendar` - Event date, events, timeline
- `Users` - Guest management, people
- `ClipboardList` - Checklists, tasks
- `Building2` - Venues, vendors
- `FileText` - Contracts, documents
- `Bookmark` - Save favorites, bookmarks

### 📍 Location & Contact

- `MapPin` - Venues, locations
- `Phone` - Contact information
- `Mail` - Email communication
- `Clock` - Time, schedules
- `Navigation` - Directions, maps
- `Globe` - Website, online presence

### 💰 Budget & Finance

- `DollarSign` - Budget, pricing
- `CreditCard` - Payments
- `Receipt` - Invoices, receipts
- `Calculator` - Budget calculations
- `PiggyBank` - Savings, budget tracking

### 🎨 Design & Aesthetics

- `Palette` - Color schemes, design
- `Image` - Photos, galleries
- `Layout` - Seating arrangements
- `Grid` - Organization, layouts
- `Brush` - Decorations, styling

### 🔧 Tools & Settings

- `Search` - Find vendors, search
- `Filter` - Filter options
- `Settings` - Preferences, configuration
- `User` - Profile, account
- `LogOut` - Authentication
- `Menu` - Navigation menu

### ✅ Status & Feedback

- `CheckCircle` - Success, completed
- `AlertCircle` - Warning, attention
- `XCircle` - Error, cancelled
- `Star` - Favorites, ratings
- `ThumbsUp` - Approval, like
- `Info` - Information, help

### 📱 UI & Navigation

- `ChevronRight` - Next, forward
- `ChevronDown` - Expand, dropdown
- `ArrowRight` - Continue, proceed
- `ArrowLeft` - Back, previous
- `Plus` - Add, create
- `Minus` - Remove, delete
- `Edit` - Edit, modify
- `Trash` - Delete, remove

## 🚀 Usage Examples

### Direct Import (Recommended)

```tsx
import { Heart, Calendar, Users } from 'lucide-react';

// In your component
<Heart className="w-6 h-6 text-primary-500" />
<Calendar className="w-8 h-8 text-secondary-600" />
<Users className="w-5 h-5 text-text-primary" />
```

### Using the Icon Component

```tsx
import { Icon } from '@/components/ui';

// In your component
<Icon name="Heart" size="lg" className="text-primary-500" />
<Icon name="Calendar" size="xl" className="text-secondary-600" />
<Icon name="Users" size="md" className="text-text-primary" />
```

### With Buttons

```tsx
import { Button } from '@/components/ui';
import { Heart, Calendar } from 'lucide-react';

<Button>
  <Heart className="w-4 h-4 mr-2" />
  Add to Favorites
</Button>

<Button variant="outline">
  <Calendar className="w-4 h-4 mr-2" />
  Schedule Event
</Button>
```

### With Cards

```tsx
import { Card, CardHeader, CardTitle } from "@/components/ui";
import { Users, Building2 } from "lucide-react";

<Card>
  <CardHeader>
    <div className="flex items-center space-x-2">
      <Users className="w-5 h-5 text-primary-600" />
      <CardTitle>Guest Management</CardTitle>
    </div>
  </CardHeader>
</Card>;
```

## 🎨 Styling Tips

### Color Classes

- `text-primary-500` - Primary brand color
- `text-secondary-500`