"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Filter } from "lucide-react";
import { Client } from "@/types/app"; // Import Client type

type SortBy = 'none' | 'school' | 'averageEventSize' | 'numberOfEvents' | 'clientScore';
type SortOrder = 'asc' | 'desc';

interface ClientFilterSortProps {
  onFilterSortChange: (
    filterSchool: string,
    sortBy: SortBy,
    sortOrder: SortOrder
  ) => void;
}

export const ClientFilterSort: React.FC<ClientFilterSortProps> = ({ onFilterSortChange }) => {
  const [filterSchool, setFilterSchool] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleApply = () => {
    onFilterSortChange(filterSchool, sortBy, sortOrder);
  };

  const handleReset = () => {
    setFilterSchool("");
    setSortBy('none');
    setSortOrder('asc');
    onFilterSortChange("", 'none', 'asc'); // Reset immediately
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
          <SheetTitle className="text-white">Filter & Sort Clients</SheetTitle>
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
            <Label htmlFor="sortBy" className="text-white">Sort By</Label>
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="bg-input text-foreground border-border">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="averageEventSize">Average Event Size</SelectItem>
                <SelectItem value="numberOfEvents"># of Events</SelectItem>
                <SelectItem value="clientScore">Client Score</SelectItem>
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