import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  subscribeToBuildings, 
  subscribeToExpenses, 
  subscribeToReminders,
  addBuilding as fbAddBuilding,
  updateBuilding,
  updateUnit,
  addExpense as fbAddExpense,
  addReminder as fbAddReminder,
  updateReminder,
  uploadTenantDocument,
  fetchExpenses,
  deleteDoc,
  doc
} from '@/lib/firebaseUtils';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ensureDate } from '@/lib/firebase';
import { db } from '@/lib/firebase';

export type Expense = {
  id: string;
  date: Date;
  amount: number;
  description: string;
  buildingId?: string;
  unitId?: string;
  ownerId?: string;
};

export type ElectricityRecord = {
  id: string;
  date: Date;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
};

export type RentPayment = {
  id: string;
  date: Date;
  amount: number;
  month: string;
  year: number;
  paymentMethod?: string;
  remarks?: string;
};

export type Tenant = {
  id: string;
  name: string;
  contactNo: string;
  memberCount: number;
  rentAmount: number;
  roomDetails: string;
  about: string;
  idProof?: string | File;
  policeVerification?: string | File;
  rentPayments: RentPayment[];
  electricityRecords: ElectricityRecord[];
  active: boolean;
  moveInDate?: Date | null;
  moveOutDate?: Date | null;
  ownerId?: string;
  otherDocuments?: string | File;
  buildingId?: string;
  buildingName?: string;
  unitId?: string;
  unitName?: string;
};

export type Unit = {
  id: string;
  name: string;
  floor?: string;
  details?: string;
  tenant: Tenant | null;
  previousTenants: Tenant[];
  buildingId?: string;
  buildingName?: string;
};

export type Building = {
  id: string;
  name: string;
  unitsCount: number;
  address?: string;
  units: Unit[];
  ownerId: string;
};

export type Reminder = {
  id: string;
  date: Date;
  time: string;
  title: string;
  message: string;
  completed: boolean;
  sendSMS?: boolean;
  phone?: string;
};

type RentRoostContextType = {
  buildings: Building[];
  currentBuilding: Building | null;
  currentUnit: Unit | null;
  expenses: Expense[];
  reminders: Reminder[];
  previousTenants: Tenant[];
  isLoading: boolean;
  
  addBuilding: (name: string, unitsCount: number, address?: string) => Promise<boolean>;
  selectBuilding: (buildingId: string) => void;
  selectUnit: (unitId: string) => void;
  addTenant: (unitId: string, tenant: Omit<Tenant, 'id' | 'rentPayments' | 'electricityRecords' | 'active'>) => Promise<void>;
  addRentPayment: (unitId: string, payment: Omit<RentPayment, 'id'>) => Promise<void>;
  addElectricityRecord: (unitId: string, record: Omit<ElectricityRecord, 'id'>) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'completed'>) => Promise<void>;
  markReminderComplete: (reminderId: string) => Promise<void>;
  moveTenantToPrevious: (unitId: string) => Promise<void>;
  getTotalsByDateRange: (startDate: Date, endDate: Date) => {
    totalRent: number;
    totalElectricity: number;
    totalExpense: number;
  };
  editRentPayment: (unitId: string, paymentId: string, payment: Omit<RentPayment, 'id'>) => Promise<void>;
  editElectricityRecord: (unitId: string, recordId: string, record: Omit<ElectricityRecord, 'id'>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
};

const RentRoostContext = createContext<RentRoostContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 11);

const API_URL = 'https://rently-vxim.onrender.com';

const RentRoostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [previousTenants, setPreviousTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();

  // Extract previous tenants from all building units
  const extractPreviousTenantsFromBuildings = (buildings: Building[]) => {
    const allPreviousTenants: Tenant[] = [];
    buildings.forEach(building => {
      building.units.forEach(unit => {
        if (unit.previousTenants && unit.previousTenants.length > 0) {
          const tenantsWithContext = unit.previousTenants.map(tenant => ({
            ...tenant,
            buildingId: building.id,
            buildingName: building.name,
            unitId: unit.id,
            unitName: unit.name,
          }));
          allPreviousTenants.push(...tenantsWithContext);
        }
      });
    });
    return allPreviousTenants;
  };

  useEffect(() => {
    if (!currentUser) {
      setBuildings([]);
      setCurrentBuilding(null);
      setCurrentUnit(null);
      setExpenses([]);
      setReminders([]);
      setPreviousTenants([]);
      setIsLoading(false);
      return () => {};
    }
    
    setIsLoading(true);
    console.log("Setting up Firebase subscriptions for user:", currentUser.uid);
    
    const loadInitialExpenses = async () => {
      try {
        console.log("Performing initial fetch of expenses");
        const fetchedExpenses = await fetchExpenses();
        console.log("Initial expenses fetch successful:", fetchedExpenses.length, "expenses");
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error("Error in initial expenses fetch:", error);
      }
    };
    
    loadInitialExpenses();
    
    const unsubscribeBuildings = subscribeToBuildings((data) => {
      console.log("Buildings subscription updated:", data.length, "buildings");
      setBuildings(data);
      
      // Extract and update previous tenants from building units
      const previousTenantsFromBuildings = extractPreviousTenantsFromBuildings(data);
      console.log("Extracted previous tenants from buildings:", previousTenantsFromBuildings.length);
      setPreviousTenants(previousTenantsFromBuildings);
      
      if (currentBuilding) {
        const updated = data.find(b => b.id === currentBuilding.id);
        if (updated) setCurrentBuilding(updated);
      }
      
      if (currentBuilding && currentUnit) {
        const updatedBuilding = data.find(b => b.id === currentBuilding.id);
        if (updatedBuilding) {
          const updatedUnit = updatedBuilding.units.find(u => u.id === currentUnit.id);
          if (updatedUnit) setCurrentUnit(updatedUnit);
        }
      }
    });
    
    const unsubscribeExpenses = subscribeToExpenses((data) => {
      console.log("Expenses subscription updated:", data.length, "expenses");
      if (data.length > 0) {
        console.log("Sample expense from subscription:", data[0]);
      }
      setExpenses(data);
    });
    
    const unsubscribeReminders = subscribeToReminders((data) => {
      console.log("Reminders subscription updated:", data);
      setReminders(data);
    });
    
    setIsLoading(false);
    
    return () => {
      console.log("Cleaning up subscriptions");
      unsubscribeBuildings();
      unsubscribeExpenses();
      unsubscribeReminders();
    };
  }, [currentUser]);

  const addBuilding = async (name: string, unitsCount: number, address?: string) => {
    try {
      console.log("Adding building:", { name, unitsCount, address });
      
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      const units: Unit[] = Array.from({ length: unitsCount }, (_, index) => ({
        id: generateId(),
        name: `Unit ${index + 1}`,
        tenant: null,
        previousTenants: [],
        buildingId: '',
        buildingName: '',
      }));

      const newBuilding: Omit<Building, 'id'> = {
        name,
        unitsCount,
        address,
        units,
        ownerId: currentUser.uid,
      };

      console.log("Prepared building data:", JSON.stringify(newBuilding));
      await fbAddBuilding(newBuilding);
      console.log("Building added successfully");
      return true;
    } catch (error) {
      console.error("Error adding building in context:", error);
      toast.error(`Failed to add building: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    }
  };

  const selectBuilding = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId) || null;
    setCurrentBuilding(building);
    setCurrentUnit(null);
  };

  const selectUnit = (unitId: string) => {
    if (!currentBuilding) return;
    const unit = currentBuilding.units.find(u => u.id === unitId) || null;
    setCurrentUnit(unit);
  };

  const addTenant = async (unitId: string, tenantData: Omit<Tenant, 'id' | 'rentPayments' | 'electricityRecords' | 'active'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }

      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1) {
        throw new Error(`Unit ${unitId} not found in building ${currentBuilding.id}`);
      }

      let idProofURL = undefined;
      let policeVerificationURL = undefined;

      if (tenantData.idProof && tenantData.idProof instanceof File) {
        idProofURL = await uploadTenantDocument(
          tenantData.idProof,
          currentBuilding.id,
          unitId,
          'idProof'
        );
        console.log("ID Proof uploaded to Firebase Storage:", idProofURL);
      }

      if (tenantData.policeVerification && tenantData.policeVerification instanceof File) {
        policeVerificationURL = await uploadTenantDocument(
          tenantData.policeVerification,
          currentBuilding.id,
          unitId,
          'policeVerification'
        );
        console.log("Police Verification uploaded to Firebase Storage:", policeVerificationURL);
      }

      const existingUnit = currentBuilding.units[unitIndex];
      const existingTenant = existingUnit.tenant;
      
      const newTenant = {
        id: existingTenant ? existingTenant.id : generateId(),
        ...tenantData,
        rentPayments: existingTenant ? existingTenant.rentPayments : [],
        electricityRecords: existingTenant ? existingTenant.electricityRecords : [],
        active: true,
        moveInDate: existingTenant?.moveInDate || new Date(),
        idProof: idProofURL || tenantData.idProof || existingTenant?.idProof,
        policeVerification: policeVerificationURL || tenantData.policeVerification || existingTenant?.policeVerification,
        otherDocuments: tenantData.otherDocuments || existingTenant?.otherDocuments,
      };

      const updatedUnit = {
        ...currentBuilding.units[unitIndex],
        tenant: newTenant,
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      console.log(existingTenant ? "Tenant updated successfully:" : "Tenant added successfully:", newTenant.name);
      toast.success(existingTenant ? "Tenant updated successfully" : "Tenant added successfully");
    } catch (error) {
      console.error("Error adding/updating tenant:", error);
      toast.error("Failed to " + (currentBuilding?.units.find(u => u.id === unitId)?.tenant ? "update" : "add") + " tenant: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const addRentPayment = async (unitId: string, payment: Omit<RentPayment, 'id'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }

      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1 || !currentBuilding.units[unitIndex].tenant) {
        throw new Error("Unit not found or has no tenant");
      }

      const unit = currentBuilding.units[unitIndex];
      const tenant = unit.tenant!;
      
      // Initialize rentPayments array if it doesn't exist
      if (!tenant.rentPayments || !Array.isArray(tenant.rentPayments)) {
        console.log("Initializing tenant.rentPayments array");
        tenant.rentPayments = [];
      }
      
      const newPayment = { ...payment, id: generateId() };
      
      const updatedTenant = {
        ...tenant,
        rentPayments: [...tenant.rentPayments, newPayment],
      };
      
      const updatedUnit = {
        ...unit,
        tenant: updatedTenant
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      console.log("Rent payment added successfully");
      toast.success("Rent payment added successfully");
    } catch (error) {
      console.error("Error adding rent payment:", error);
      toast.error("Failed to add rent payment: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const addElectricityRecord = async (unitId: string, record: Omit<ElectricityRecord, 'id'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }

      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1 || !currentBuilding.units[unitIndex].tenant) {
        throw new Error("Unit not found or has no tenant");
      }

      const unit = currentBuilding.units[unitIndex];
      const tenant = unit.tenant!;
      
      // Initialize electricityRecords array if it doesn't exist
      if (!tenant.electricityRecords || !Array.isArray(tenant.electricityRecords)) {
        console.log("Initializing tenant.electricityRecords array");
        tenant.electricityRecords = [];
      }
      
      const newRecord = { ...record, id: generateId() };
      
      const updatedTenant = {
        ...tenant,
        electricityRecords: [...tenant.electricityRecords, newRecord],
      };
      
      const updatedUnit = {
        ...unit,
        tenant: updatedTenant
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      console.log("Electricity record added successfully");
      toast.success("Electricity record added successfully");
    } catch (error) {
      console.error("Error adding electricity record:", error);
      toast.error("Failed to add electricity record: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      console.log("Adding expense in context:", expense);
      await fbAddExpense(expense);
      toast.success("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'completed'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      console.log('Adding reminder with data:', reminder);
      const addedReminderId = await fbAddReminder(reminder);
      console.log('Reminder added with ID:', addedReminderId);
      
      if (reminder.sendSMS && reminder.phone) {
        try {
          console.log('Sending SMS to:', reminder.phone, 'with reminder:', reminder.title);
          
          const response = await fetch(`${API_URL}/api/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              reminder: {
                ...reminder,
                id: addedReminderId
              }, 
              phone: reminder.phone 
            })
          });
          
          if (!response.ok) {
            const result = await response.json();
            console.error('SMS notification failed:', result);
            toast.error('Failed to send SMS notification');
          } else {
            const result = await response.json();
            console.log('SMS notification response:', result);
            toast.success('SMS notification scheduled successfully');
          }
        } catch (smsError) {
          console.error('SMS sending error:', smsError);
          toast.error('Error scheduling SMS notification');
        }
      }
      
      toast.success("Reminder added successfully");
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Failed to add reminder: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const markReminderComplete = async (reminderId: string) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {
        console.error("Reminder not found:", reminderId);
        console.log("Available reminders:", reminders);
        throw new Error("Reminder not found");
      }
      
      console.log("Marking reminder as complete:", reminder);
      const updatedReminder = { ...reminder, completed: true };
      await updateReminder(updatedReminder);
      toast.success("Reminder marked as completed");
    } catch (error) {
      console.error("Error marking reminder as complete:", error);
      toast.error("Failed to update reminder: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const moveTenantToPrevious = async (unitId: string) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }
      
      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1 || !currentBuilding.units[unitIndex].tenant) {
        throw new Error("Unit not found or has no tenant");
      }

      const unit = currentBuilding.units[unitIndex];
      const tenant = unit.tenant!;
      
      console.log("Moving tenant to previous:", tenant.name);
      
      const updatedTenant: Tenant = {
        ...tenant,
        active: false,
        moveOutDate: new Date(),
        ownerId: currentUser.uid,
        name: tenant.name,
        contactNo: tenant.contactNo,
        memberCount: tenant.memberCount,
        rentAmount: tenant.rentAmount,
        roomDetails: tenant.roomDetails || '',
        about: tenant.about || '',
        rentPayments: tenant.rentPayments || [],
        electricityRecords: tenant.electricityRecords || [],
      };
      
      // Add building info to tenant for proper association
      const tenantWithBuildingInfo = {
        ...updatedTenant,
        buildingId: currentBuilding.id,
        buildingName: currentBuilding.name,
        unitId: unit.id,
        unitName: unit.name,
      };
      
      const updatedUnit = {
        ...unit,
        previousTenants: [...unit.previousTenants, tenantWithBuildingInfo],
        tenant: null,
        buildingId: currentBuilding.id,
        buildingName: currentBuilding.name,
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      console.log("Tenant successfully moved to previous tenants");
      toast.success("Tenant moved to previous tenants");
    } catch (error) {
      console.error("Error moving tenant to previous:", error);
      toast.error("Failed to move tenant: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const getTotalsByDateRange = (startDate: Date, endDate: Date) => {
    let totalRent = 0;
    let totalElectricity = 0;
    let totalExpense = 0;
    
    const currentUserId = currentUser?.uid;
    if (!currentUserId) {
      console.log("No current user when calculating totals");
      return { totalRent: 0, totalElectricity: 0, totalExpense: 0 };
    }

    const userBuildings = buildings.filter(building => building.ownerId === currentUserId);
    
    console.log(`Calculating totals from ${startDate} to ${endDate} for user ${currentUserId}`);
    console.log(`User buildings: ${userBuildings.length}`);

    userBuildings.forEach(building => {
      building.units.forEach(unit => {
        // Process current tenant payments
        if (unit.tenant) {
          (unit.tenant.rentPayments || [])
            .forEach(payment => {
              try {
                const paymentDate = ensureDate(payment.date);
                if (paymentDate >= startDate && paymentDate <= endDate) {
                  totalRent += payment.amount;
                  console.log(`Added rent payment: ${payment.amount} from ${format(paymentDate, 'yyyy-MM-dd')}`);
                }
              } catch (error) {
                console.error("Error processing payment date:", error);
              }
            });
          
          (unit.tenant.electricityRecords || [])
            .forEach(record => {
              try {
                const recordDate = ensureDate(record.date);
                if (recordDate >= startDate && recordDate <= endDate) {
                  totalElectricity += record.amount;
                  console.log(`Added electricity: ${record.amount} from ${format(recordDate, 'yyyy-MM-dd')}`);
                }
              } catch (error) {
                console.error("Error processing electricity record date:", error);
              }
            });
        }

        // Process previous tenants payments
        (unit.previousTenants || []).forEach(previousTenant => {
          (previousTenant.rentPayments || [])
            .forEach(payment => {
              try {
                const paymentDate = ensureDate(payment.date);
                if (paymentDate >= startDate && paymentDate <= endDate) {
                  totalRent += payment.amount;
                  console.log(`Added previous tenant rent payment: ${payment.amount} from ${format(paymentDate, 'yyyy-MM-dd')}`);
                }
              } catch (error) {
                console.error("Error processing previous tenant payment date:", error);
              }
            });
          
          (previousTenant.electricityRecords || [])
            .forEach(record => {
              try {
                const recordDate = ensureDate(record.date);
                if (recordDate >= startDate && recordDate <= endDate) {
                  totalElectricity += record.amount;
                  console.log(`Added previous tenant electricity: ${record.amount} from ${format(recordDate, 'yyyy-MM-dd')}`);
                }
              } catch (error) {
                console.error("Error processing previous tenant electricity record date:", error);
              }
            });
        });
      });
    });

    (expenses || [])
      .filter(expense => expense.ownerId === currentUserId)
      .forEach(expense => {
        try {
          const expenseDate = ensureDate(expense.date);
          if (expenseDate >= startDate && expenseDate <= endDate) {
            totalExpense += expense.amount;
            console.log(`Added expense: ${expense.amount} from ${format(expenseDate, 'yyyy-MM-dd')}`);
          }
        } catch (error) {
          console.error("Error processing expense date:", error);
        }
      });

    console.log(`Totals calculated - Rent: ${totalRent}, Electricity: ${totalElectricity}, Expense: ${totalExpense}`);
    return { totalRent, totalElectricity, totalExpense };
  };

  const editRentPayment = async (unitId: string, paymentId: string, payment: Omit<RentPayment, 'id'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }

      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1 || !currentBuilding.units[unitIndex].tenant) {
        throw new Error("Unit not found or has no tenant");
      }

      const unit = currentBuilding.units[unitIndex];
      const tenant = unit.tenant!;
      
      // Initialize rentPayments array if it doesn't exist
      if (!tenant.rentPayments || !Array.isArray(tenant.rentPayments)) {
        console.log("Cannot edit payment: rentPayments array does not exist");
        throw new Error("Rent payments array not found");
      }
      
      const updatedPayments = tenant.rentPayments.map(p => 
        p.id === paymentId ? { ...payment, id: paymentId } : p
      );
      
      const updatedTenant = {
        ...tenant,
        rentPayments: updatedPayments,
      };
      
      const updatedUnit = {
        ...unit,
        tenant: updatedTenant
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      toast.success("Rent payment updated successfully");
    } catch (error) {
      console.error("Error editing rent payment:", error);
      toast.error("Failed to update rent payment: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const editElectricityRecord = async (unitId: string, recordId: string, record: Omit<ElectricityRecord, 'id'>) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      if (!currentBuilding) {
        throw new Error("No building selected");
      }

      const unitIndex = currentBuilding.units.findIndex(u => u.id === unitId);
      if (unitIndex === -1 || !currentBuilding.units[unitIndex].tenant) {
        throw new Error("Unit not found or has no tenant");
      }

      const unit = currentBuilding.units[unitIndex];
      const tenant = unit.tenant!;
      
      // Initialize electricityRecords array if it doesn't exist
      if (!tenant.electricityRecords || !Array.isArray(tenant.electricityRecords)) {
        console.log("Cannot edit record: electricityRecords array does not exist");
        throw new Error("Electricity records array not found");
      }
      
      const updatedRecords = tenant.electricityRecords.map(r => 
        r.id === recordId ? { ...record, id: recordId } : r
      );
      
      const updatedTenant = {
        ...tenant,
        electricityRecords: updatedRecords,
      };
      
      const updatedUnit = {
        ...unit,
        tenant: updatedTenant
      };
      
      const updatedBuilding = {
        ...currentBuilding,
        units: [
          ...currentBuilding.units.slice(0, unitIndex),
          updatedUnit,
          ...currentBuilding.units.slice(unitIndex + 1)
        ]
      };
      
      await updateBuilding(updatedBuilding);
      
      setCurrentBuilding(updatedBuilding);
      setBuildings(prev => 
        prev.map(b => b.id === updatedBuilding.id ? updatedBuilding : b)
      );
      
      toast.success("Electricity record updated successfully");
    } catch (error) {
      console.error("Error editing electricity record:", error);
      toast.error("Failed to update electricity record: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {
        console.error("Reminder not found:", reminderId);
        throw new Error("Reminder not found");
      }
      
      await deleteDoc(doc(db, "reminders", reminderId));
      toast.success("Reminder deleted successfully");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
        console.error("Expense not found:", expenseId);
        throw new Error("Expense not found");
      }
      
      await deleteDoc(doc(db, "expenses", expenseId));
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense: " + (error instanceof Error ? error.message : "Unknown error"));
      throw error;
    }
  };

  const value = {
    buildings,
    currentBuilding,
    currentUnit,
    expenses,
    reminders,
    previousTenants,
    isLoading,
    addBuilding,
    selectBuilding,
    selectUnit,
    addTenant,
    addRentPayment,
    addElectricityRecord,
    addExpense,
    addReminder,
    markReminderComplete,
    moveTenantToPrevious,
    getTotalsByDateRange,
    editRentPayment,
    editElectricityRecord,
    deleteReminder,
    deleteExpense,
  };

  return (
    <RentRoostContext.Provider value={value}>
      {children}
    </RentRoostContext.Provider>
  );
};

const useRentRoost = () => {
  const context = useContext(RentRoostContext);
  if (context === undefined) {
    throw new Error('useRentRoost must be used within a RentRoostProvider');
  }
  return context;
};

export { RentRoostProvider, useRentRoost };
