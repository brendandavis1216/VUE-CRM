"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarCheck, Users, TrendingUp, CalendarDays, BriefcaseBusiness, Lightbulb, Wallet, Award, CalendarClock, ArrowRightLeft } from "lucide-react"; // Added new icons
import { useAppContext } from "@/context/AppContext";
import { addDays, isBefore, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"; // Import new date-fns utilities

const DashboardPage = () => {
  const { clients, events, inquiries, leads } = useAppContext();

  const totalRevenue = events.reduce((sum, event) => sum + event.budget, 0);
  const eventsThisYear = events.filter(event => event.eventDate.getFullYear() === new Date().getFullYear()).length;
  const totalClients = clients.length;
  const averageClientScore = clients.length > 0 ? clients.reduce((sum, client) => sum + client.clientScore, 0) / clients.length : 0;

  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);
  const upcomingEventsCount = events.filter(event => event.eventDate >= now && isBefore(event.eventDate, thirtyDaysFromNow)).length;
  const pendingInquiriesCount = inquiries.filter(inquiry => inquiry.progress < 100).length;
  const totalLeadsCount = leads.length;
  const averageBudgetPerEvent = events.length > 0 ? totalRevenue / events.length : 0;

  // NEW METRICS
  const clientsWithThreePlusEvents = clients.filter(client => client.numberOfEvents >= 3).length;

  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);
  const eventsCompletedThisMonth = events.filter(event =>
    event.status === "Completed" && isWithinInterval(event.eventDate, { start: startOfCurrentMonth, end: endOfCurrentMonth })
  ).length;

  // Conversion rates (approximations based on current state)
  const inquiryToEventConversionRate = (events.length + inquiries.length) > 0
    ? (events.length / (events.length + inquiries.length)) * 100
    : 0;

  const leadToInquiryConversionRate = (leads.length > 0 && inquiries.length > 0)
    ? (inquiries.length / leads.length) * 100
    : 0; // This is a very rough approximation. A more accurate one would require tracking leadId on inquiry.

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-white text-center mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events This Year</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsThisYear}</div>
            <p className="text-xs text-muted-foreground">+15% from last year</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">+5 new clients this quarter</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Client Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageClientScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Based on event history</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events (30 Days)</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEventsCount}</div>
            <p className="text-xs text-muted-foreground">Events scheduled soon</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inquiries</CardTitle>
            <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInquiriesCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeadsCount}</div>
            <p className="text-xs text-muted-foreground">Potential clients</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Budget per Event</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageBudgetPerEvent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">Average value of events</p>
          </CardContent>
        </Card>

        {/* NEW CARDS START HERE */}
        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients with 3+ Events</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithThreePlusEvents}</div>
            <p className="text-xs text-muted-foreground">High-volume clients</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Completed This Month</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsCompletedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Recent successful events</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiry to Event Conversion</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiryToEventConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of active pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead to Inquiry Conversion</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadToInquiryConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of total leads to inquiries</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;