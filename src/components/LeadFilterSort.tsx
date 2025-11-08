"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter } from "lucide-react";

type SortBy = 'none' | 'name' | 'school' | 'fraternity' | 'status';
type SortOrder = 'asc' | 'desc';

interface LeadFilterSortProps {
  onFilterSortChange: (
    filterSchool: string,
    filterFraternity: string,
    sortBy: SortBy,
    sortOrder: SortOrder
  ) => void;
  currentFilterSchool: string;
  currentFilterFraternity: string;
  currentSortBy: SortBy;
  currentSortOrder: SortOrder;
}

export const LeadFilterSort: React.FC<LeadFilterSortProps> = ({
  onFilterSortChange,
  currentFilterSchool,
  currentFilterFraternity,
  currentSortBy,
  currentSortOrder,
}) => {
  const [filterSchool, setFilterSchool] = useState(currentFilterSchool);
  const [filterFraternity, setFilterFraternity] = useState(currentFilterFraternity);
  const [sortBy, setSortBy] = useState<SortBy>(currentSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(currentSortOrder);

  const handleApply = () => {
    onFilterSortChange(filterSchool, filterFraternity, sortBy, sortOrder);
  };

  const handleReset = () => {
    setFilterSchool("");
    setFilterFraternity("");
    setSortBy('none');
    setSortOrder('asc');
    onFilterSortChange("", "", 'none', 'asc'); // Reset immediately
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card text-card-foreground border-border">
        <SheetHeader>
          <SheetTitle className="text-white">Filter & Sort Leads</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="schoolFilter" className="text-white">Filter by School</Label>
            <Input
              id="schoolFilter"
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              placeholder="e.g., State University"
              className="bg-input text-foreground border-border"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fraternityFilter" className="text-white">Filter by Fraternity</Label>
            <Input
              id="fraternityFilter"
              value={filterFraternity}
              onChange={(e) => setFilterFraternity(e.target.value)}
              placeholder="e.g., Alpha Beta Gamma"
              className="bg-input text-foreground border-border"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sortBy" className="text-white">Sort By</Label>
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="bg-input text-foreground border-border">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="fraternity">Fraternity</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sortOrder" className="text-white">Sort Order: {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</Label>
            <Switch
              id="sortOrder"
              checked={sortOrder === 'desc'}
              onCheckedChange={(checked) => setSortOrder(checked ? 'desc' : 'asc')}
              className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
            />
          </div>

          <Button onClick={handleApply} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Apply Filters & Sort</Button>
          <Button variant="outline" onClick={handleReset} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">Reset</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};