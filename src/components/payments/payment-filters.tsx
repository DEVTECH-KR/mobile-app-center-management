// src/components/payments/payment-filters.tsx
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FilterX } from "lucide-react";
import { PaymentFilters, PaymentFilterType } from '@/lib/types/payment.types';

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  onClearFilters: () => void;
}

export function PaymentFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: PaymentFiltersProps) {
  const updateFilter = (type: PaymentFilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [type]: value
    });
  };

  const hasActiveFilters = filters.searchTerm.length > 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email..."
              className="pl-9"
              value={filters.searchTerm}
              onChange={(e) => updateFilter(PaymentFilterType.SEARCH, e.target.value)}
            />
          </div>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="shrink-0">
              <FilterX className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}