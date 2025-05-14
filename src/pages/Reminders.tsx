import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { BellRing, Plus, Calendar, Check, Phone, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRentRoost } from "@/context/RentRoostContext";
import { format, isPast, isToday, isValid, set } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const safeFormat = (date: Date | null | undefined, formatStr: string, fallback: string = "N/A"): string => {
  if (!date || !isValid(date)) {
    return fallback;
  }
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error("Date format error:", error, date);
    return fallback;
  }
};

const safeIsPast = (date: Date | null | undefined): boolean => {
  if (!date || !isValid(date)) {
    return false;
  }
  try {
    return isPast(date) && !isToday(date);
  } catch (error) {
    console.error("Date check error:", error, date);
    return false;
  }
};

const safeIsToday = (date: Date | null | undefined): boolean => {
  if (!date || !isValid(date)) {
    return false;
  }
  try {
    return isToday(date);
  } catch (error) {
    console.error("Date check error:", error, date);
    return false;
  }
};

const Reminders = () => {
  const { reminders, addReminder, markReminderComplete, deleteReminder } = useRentRoost();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
    sendSMS: false,
    phone: "",
  });

  useEffect(() => {
    console.log("Reminders component rendered with reminders:", reminders);
  }, [reminders]);

  const handleAddReminder = () => {
    if (!formData.title || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const [hours, minutes] = formData.time.split(':').map(Number);
    const reminderDateTime = set(formData.date, {
      hours,
      minutes,
      seconds: 0,
      milliseconds: 0
    });
    
    console.log("Adding reminder with date/time:", reminderDateTime, formData.time);
    
    addReminder({
      title: formData.title,
      message: formData.message,
      date: reminderDateTime,
      time: formData.time,
      sendSMS: formData.sendSMS,
      phone: formData.sendSMS ? formData.phone : undefined,
    });
    
    setFormData({
      title: "",
      message: "",
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      sendSMS: false,
      phone: "",
    });
    
    setOpen(false);
    toast.success("Reminder added successfully");
  };

  const handleMarkComplete = (reminderId: string) => {
    markReminderComplete(reminderId);
    toast.success("Reminder marked as completed");
  };

  console.log("Current reminders in render:", reminders);

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    const dateA = a.date instanceof Date && isValid(a.date) ? a.date.getTime() : 0;
    const dateB = b.date instanceof Date && isValid(b.date) ? b.date.getTime() : 0;
    return dateA - dateB;
  });

  const pendingReminders = sortedReminders.filter(r => !r.completed);
  const completedReminders = sortedReminders.filter(r => r.completed);

  console.log("Pending reminders count:", pendingReminders.length);
  console.log("Completed reminders count:", completedReminders.length);
  console.log("Pending reminders data:", pendingReminders);

  return (
    <Layout title="Reminders">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rentroost-dark">Reminders</h2>
            <p className="text-gray-500">
              {pendingReminders.length > 0
                ? `You have ${pendingReminders.length} pending reminders`
                : "No pending reminders"}
            </p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reminder</DialogTitle>
                <DialogDescription>
                  Create a new reminder with optional SMS notification.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter reminder title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {isValid(formData.date) 
                            ? safeFormat(formData.date, "PPP", "Select date") 
                            : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto">
                        <CalendarComponent
                          mode="single"
                          selected={isValid(formData.date) ? formData.date : undefined}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="message" className="text-right">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter reminder message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sendSMS" className="text-right">
                    Send SMS
                  </Label>
                  <div className="flex items-center space-x-2 col-span-3">
                    <Switch
                      id="sendSMS"
                      checked={formData.sendSMS}
                      onCheckedChange={(checked) => setFormData({ ...formData, sendSMS: checked })}
                    />
                    <Label htmlFor="sendSMS">Enable SMS notification</Label>
                  </div>
                </div>

                {formData.sendSMS && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddReminder}>Add Reminder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Pending Reminders</h3>
          
          {pendingReminders.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingReminders.map((reminder) => {
                const isOverdue = safeIsPast(reminder.date);
                const isDueToday = safeIsToday(reminder.date);
                
                return (
                  <Card key={reminder.id} className={cn(
                    "overflow-hidden",
                    isOverdue ? "border-l-4 border-l-red-500" : 
                    isDueToday ? "border-l-4 border-l-yellow-500" : ""
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        <div className={cn(
                          "p-2 rounded-full",
                          isOverdue ? "bg-red-100 text-red-600" : 
                          isDueToday ? "bg-yellow-100 text-yellow-600" : 
                          "bg-rentroost-accent text-rentroost-primary"
                        )}>
                          <BellRing className="h-4 w-4" />
                        </div>
                      </div>
                      <CardDescription>
                        {isValid(reminder.date) 
                          ? safeFormat(reminder.date, "EEEE, MMMM d, yyyy", "Invalid Date") 
                          : "Date not set"}
                        {isOverdue && (
                          <span className="ml-2 text-red-500 font-medium">Overdue</span>
                        )}
                        {isDueToday && (
                          <span className="ml-2 text-yellow-500 font-medium">Today</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{reminder.message}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs bg-gray-100 text-gray-600 p-2 rounded">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled for: {reminder.time || "Not specified"}</span>
                      </div>
                      
                      {reminder.sendSMS && reminder.phone && (
                        <div className="flex items-center gap-2 mt-3 text-xs bg-blue-50 text-blue-600 p-2 rounded">
                          <Phone className="h-3 w-3" />
                          <span>SMS notification to {reminder.phone}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleMarkComplete(reminder.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rentroost-accent mb-4">
                <BellRing className="h-6 w-6 text-rentroost-primary" />
              </div>
              <h4 className="text-lg font-medium mb-2">No Pending Reminders</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any pending reminders. Add a new reminder to stay organized.
              </p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Reminder
              </Button>
            </div>
          )}
          
          {completedReminders.length > 0 && (
            <>
              <h3 className="text-lg font-medium mt-8">Completed Reminders</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {completedReminders.map((reminder) => (
                    <div key={reminder.id} className="bg-white p-3 rounded border flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-green-100 text-green-600">
                          <Check className="h-3 w-3" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{reminder.title}</h4>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {isValid(reminder.date) 
                              ? safeFormat(reminder.date, "MMM d, yyyy", "Invalid Date")
                              : "Date not set"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {reminder.time || "Time not set"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            toast.custom((t) => (
                              <div className="bg-white p-4 rounded-lg shadow-lg border">
                                <h3 className="font-medium mb-2">Delete Reminder</h3>
                                <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this reminder?</p>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => toast.dismiss(t)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      deleteReminder(reminder.id);
                                      toast.dismiss(t);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reminders;
