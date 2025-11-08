"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import Papa from "papaparse";
import { Lead } from "@/types/app";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

interface LeadCSVUploadProps {
  onUploadSuccess: () => void;
  onClose: () => void;
}

interface ParsedLeadRow {
  name: string;
  email?: string | null;
  phone_number?: string | null;
  school?: string | null;
  fraternity?: string | null;
  instagram_handle?: string | null; // New field
  status?: string; // Will default to 'General' if not provided
  notes?: string | null;
  election_date?: string | null; // New field
}

export const LeadCSVUpload: React.FC<LeadCSVUploadProps> = ({ onUploadSuccess, onClose }) => {
  const { addLeads } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedLeadRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      parseCSV(selectedFile);
    } else {
      setFile(null);
      setParsedData([]);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/ /g, '_'), // Normalize headers
      complete: (results) => {
        if (results.errors.length) {
          setError(results.errors[0].message);
          setParsedData([]);
          return;
        }

        const requiredHeaders = ['name'];
        const availableHeaders = results.meta.fields || [];
        
        // Check if 'name' or 'main_contact' is present for the required 'name' field
        const hasNameColumn = availableHeaders.includes('name') || availableHeaders.includes('main_contact');

        if (!hasNameColumn) {
          setError(`Missing required CSV header: 'name' or 'main_contact'. Please ensure your CSV has at least one of these columns.`);
          setParsedData([]);
          return;
        }

        const data: ParsedLeadRow[] = results.data.map((row: any) => ({
          name: row.name || row.main_contact || '', // Prioritize 'name', then 'main_contact'
          email: row.email || null, // Convert empty string to null
          phone_number: row.phone_number || null, // Convert empty string to null
          school: row.school || null, // Convert empty string to null
          fraternity: row.fraternity || null, // Convert empty string to null
          instagram_handle: row.instagram_handle || null, // Convert empty string to null
          status: row.status || 'General', // Default status
          notes: row.notes || null, // Convert empty string to null
          election_date: row.election_date || null, // Convert empty string to null
        })).filter(row => row.name.trim() !== ''); // Filter out rows with empty names

        if (data.length === 0) {
          setError("No valid lead data found in the CSV. Ensure 'name' or 'main_contact' column is populated.");
        } else {
          setParsedData(data);
        }
      },
      error: (err: any) => {
        setError(err.message);
        setParsedData([]);
      },
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to upload. Please select a valid CSV file.");
      return;
    }

    try {
      await addLeads(parsedData.map(lead => ({
        name: lead.name,
        email: lead.email,
        phone_number: lead.phone_number,
        school: lead.school,
        fraternity: lead.fraternity,
        instagram_handle: lead.instagram_handle,
        status: lead.status as Lead['status'],
        notes: lead.notes,
        election_date: lead.election_date,
      })));
      onUploadSuccess();
      onClose();
    } catch (uploadError) {
      console.error("Error during lead upload:", uploadError);
      toast.error("Failed to upload leads.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="csv-upload" className="text-white">Upload Leads CSV</Label>
        <Input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="bg-input text-foreground border-border file:text-primary file:bg-primary-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Accepted headers (case-insensitive, spaces become underscores): `name` (required, or `main_contact`), `email`, `phone_number`, `school`, `fraternity`, `instagram_handle`, `status`, `notes`, `election_date`.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parsedData.length > 0 && (
        <div className="max-h-60 overflow-y-auto border rounded-md border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">School</TableHead>
                <TableHead className="text-white">Fraternity</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Instagram</TableHead>
                <TableHead className="text-white">Election Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedData.slice(0, 10).map((lead, index) => ( // Show first 10 for preview
                <TableRow key={index}>
                  <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.school || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.fraternity || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.status || 'General'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.instagram_handle || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.election_date || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {parsedData.length > 10 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    ... {parsedData.length - 10} more leads
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <DialogFooter>
        <Button
          type="submit"
          onClick={handleUpload}
          disabled={parsedData.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Upload {parsedData.length} Leads
        </Button>
      </DialogFooter>
    </div>
  );
};