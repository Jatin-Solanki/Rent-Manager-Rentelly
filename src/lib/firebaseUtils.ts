
import { db, auth, storage } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  DocumentReference,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Building, 
  Unit, 
  Tenant, 
  RentPayment, 
  ElectricityRecord, 
  Expense,
  Reminder
} from '@/context/RentRoostContext';

// Re-export the Firebase functions we need elsewhere
export { deleteDoc, doc };

// Collections
const buildingsCol = collection(db, 'buildings');
const expensesCol = collection(db, 'expenses');
const remindersCol = collection(db, 'reminders');
// Previous tenants collection removed - data now stored within building units

// Firebase Storage Document Upload Function
export const uploadTenantDocument = async (
  file: File,
  buildingId: string,
  unitId: string,
  documentType: 'idProof' | 'policeVerification' | 'otherDocuments'
): Promise<string> => {
  if (!file) throw new Error('No file provided');

  const fileExtension = file.name.split('.').pop();
  const fileName = `${documentType}-${Date.now()}.${fileExtension}`;
  const filePath = `tenants/${buildingId}/${unitId}/${fileName}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
};

// Firebase handlers for Buildings
export const fetchBuildings = async (): Promise<Building[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    
    const q = query(buildingsCol, where("ownerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    const buildings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
    console.log("Fetched buildings:", buildings);
    return buildings;
  } catch (error) {
    console.error("Error fetching buildings:", error);
    throw error;
  }
};

export const subscribeToBuildings = (callback: (buildings: Building[]) => void) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user for building subscription");
      callback([]);
      return () => {};
    }
    
    console.log("Setting up buildings subscription for user:", currentUser.uid);
    const q = query(buildingsCol, where("ownerId", "==", currentUser.uid));
    
    return onSnapshot(q, snapshot => {
      const buildings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
      console.log("Buildings subscription updated:", buildings.length, "buildings");
      callback(buildings);
    }, error => {
      console.error("Error subscribing to buildings:", error);
    });
  } catch (error) {
    console.error("Error setting up building subscription:", error);
    return () => {}; // Return empty function in case of error
  }
};

// Tenant-specific buildings subscription (doesn't require authentication)
export const subscribeToAllBuildings = (callback: (buildings: Building[]) => void) => {
  try {
    console.log("Setting up tenant buildings subscription");
    
    return onSnapshot(buildingsCol, snapshot => {
      const buildings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Building));
      console.log("Tenant buildings subscription updated:", buildings.length, "buildings");
      callback(buildings);
    }, error => {
      console.error("Error subscribing to tenant buildings:", error);
    });
  } catch (error) {
    console.error("Error setting up tenant building subscription:", error);
    return () => {}; // Return empty function in case of error
  }
};

export const addBuilding = async (building: Omit<Building, 'id'>): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");

    // Ensure ownerId is explicitly set
    const buildingWithOwner = {
      ...building,
      ownerId: currentUser.uid,
      createdAt: serverTimestamp()
    };
    
    console.log("Adding building with data:", JSON.stringify(buildingWithOwner));
    
    const docRef = await addDoc(buildingsCol, buildingWithOwner);
    console.log("Building added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding building in firebaseUtils:", error);
    throw error;
  }
};

export const updateBuilding = async (building: Building): Promise<void> => {
  try {
    const docRef = doc(db, 'buildings', building.id);
    const { id, ...buildingData } = building;
    const cleanData = cleanUndefinedValues(buildingData);
    await setDoc(docRef, cleanData, { merge: true });
    console.log(`Building ${building.id} updated successfully`);
  } catch (error) {
    console.error("Error updating building:", error);
    throw error;
  }
};

const cleanUndefinedValues = (obj: any): any => {
  const result: any = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = cleanUndefinedValues(value);
      } else if (Array.isArray(value)) {
        result[key] = value
          .filter(item => item !== undefined)
          .map(item => {
            if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
              return cleanUndefinedValues(item);
            }
            return item;
          });
      } else {
        result[key] = value;
      }
    }
  });
  
  return result;
};

// Firebase handlers for Units and Tenants
export const updateUnit = async (buildingId: string, unit: Unit): Promise<void> => {
  try {
    const buildingRef = doc(db, 'buildings', buildingId);
    const buildingDoc = await getDoc(buildingRef);
    
    if (buildingDoc.exists()) {
      const building = buildingDoc.data() as Building;
      const updatedUnits = building.units.map(u => u.id === unit.id ? unit : u);
      
      await updateDoc(buildingRef, {
        units: updatedUnits
      });
      console.log(`Unit ${unit.id} updated successfully in building ${buildingId}`);
    } else {
      console.error(`Building ${buildingId} not found`);
      throw new Error(`Building ${buildingId} not found`);
    }
  } catch (error) {
    console.error("Error updating unit:", error);
    throw error;
  }
};

// Helper function to convert Firestore timestamp to JavaScript Date for tenant data
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  // Process dates
  if (data.moveInDate) {
    if (typeof data.moveInDate === 'object' && 'seconds' in data.moveInDate) {
      data.moveInDate = new Date(data.moveInDate.seconds * 1000);
    } else if (!(data.moveInDate instanceof Date)) {
      try {
        data.moveInDate = new Date(data.moveInDate);
      } catch (e) {
        console.error("Invalid moveInDate format:", data.moveInDate);
        data.moveInDate = null;
      }
    }
  }
  
  if (data.moveOutDate) {
    if (typeof data.moveOutDate === 'object' && 'seconds' in data.moveOutDate) {
      data.moveOutDate = new Date(data.moveOutDate.seconds * 1000);
    } else if (!(data.moveOutDate instanceof Date)) {
      try {
        data.moveOutDate = new Date(data.moveOutDate);
      } catch (e) {
        console.error("Invalid moveOutDate format:", data.moveOutDate);
        data.moveOutDate = null;
      }
    }
  }
  
  // Process file URLs to ensure they're valid
  if (data.idProof && typeof data.idProof === 'string') {
    // Make sure the URL is valid and accessible
    if (!data.idProof.startsWith('http') && !data.idProof.startsWith('blob:')) {
      console.warn("Invalid idProof URL format:", data.idProof);
    }
  }
  
  if (data.policeVerification && typeof data.policeVerification === 'string') {
    // Make sure the URL is valid and accessible
    if (!data.policeVerification.startsWith('http') && !data.policeVerification.startsWith('blob:')) {
      console.warn("Invalid policeVerification URL format:", data.policeVerification);
    }
  }
  
  // Process rent payments
  if (data.rentPayments && Array.isArray(data.rentPayments)) {
    data.rentPayments = data.rentPayments.map((payment: any) => {
      if (payment.date) {
        if (typeof payment.date === 'object' && 'seconds' in payment.date) {
          payment.date = new Date(payment.date.seconds * 1000);
        } else if (!(payment.date instanceof Date)) {
          try {
            payment.date = new Date(payment.date);
          } catch (e) {
            console.error("Invalid rent payment date format:", payment.date);
            payment.date = new Date();
          }
        }
      } else {
        payment.date = new Date();
      }
      return payment;
    });
  }
  
  // Process electricity records
  if (data.electricityRecords && Array.isArray(data.electricityRecords)) {
    data.electricityRecords = data.electricityRecords.map((record: any) => {
      if (record.date) {
        if (typeof record.date === 'object' && 'seconds' in record.date) {
          record.date = new Date(record.date.seconds * 1000);
        } else if (!(record.date instanceof Date)) {
          try {
            record.date = new Date(record.date);
          } catch (e) {
            console.error("Invalid electricity record date format:", record.date);
            record.date = new Date();
          }
        }
      } else {
        record.date = new Date();
      }
      return record;
    });
  }
  
  return data;
};

// Firebase handlers for Expenses
export const fetchExpenses = async (): Promise<Expense[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user when fetching expenses");
      throw new Error("No authenticated user");
    }
    
    console.log("Fetching expenses for user:", currentUser.uid);
    
    const q = query(expensesCol, where("ownerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No expenses found for this user");
      return [];
    }
    
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      let date = new Date();
      
      if (data.date) {
        if (typeof data.date === 'object' && 'seconds' in data.date) {
          date = new Date(data.date.seconds * 1000);
        } else {
          try {
            date = new Date(data.date);
          } catch (e) {
            console.error("Invalid expense date format:", data.date);
          }
        }
      }
      
      console.log("Processed expense:", { 
        id: doc.id, 
        ...data, 
        amount: data.amount, 
        description: data.description,
        buildingId: data.buildingId,
        ownerId: data.ownerId
      });
      
      return { 
        id: doc.id, 
        ...data, 
        date, 
        // Ensure ownerId is set
        ownerId: data.ownerId || currentUser.uid 
      } as Expense;
    });
    
    console.log("Fetched expenses count:", expenses.length);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user for expenses subscription");
      callback([]);
      return () => {};
    }
    
    console.log("Setting up expenses subscription for user:", currentUser.uid);
    const q = query(expensesCol, where("ownerId", "==", currentUser.uid));
    
    return onSnapshot(q, snapshot => {
      const expenses = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = new Date();
        
        if (data.date) {
          if (typeof data.date === 'object' && 'seconds' in data.date) {
            date = new Date(data.date.seconds * 1000);
          } else {
            try {
              date = new Date(data.date);
            } catch (e) {
              console.error("Invalid expense date format:", data.date);
            }
          }
        }
        
        console.log("Processed expense from subscription:", { 
          id: doc.id, 
          description: data.description, 
          amount: data.amount,
          buildingId: data.buildingId,
          ownerId: data.ownerId
        });
        
        return { 
          id: doc.id, 
          ...data, 
          date,
          // Ensure ownerId is set
          ownerId: data.ownerId || currentUser.uid
        } as Expense;
      });
      
      console.log("Expenses subscription updated:", expenses.length, "expenses");
      callback(expenses);
    }, error => {
      console.error("Error subscribing to expenses:", error);
    });
  } catch (error) {
    console.error("Error setting up expenses subscription:", error);
    return () => {}; // Return empty function in case of error
  }
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("User not authenticated when adding expense");
      throw new Error("No authenticated user");
    }

    console.log("Adding expense with data:", { ...expense, ownerId: currentUser.uid });
    
    const expenseWithOwner = {
      ...expense,
      ownerId: currentUser.uid,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(expensesCol, expenseWithOwner);
    console.log("Expense added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

// Firebase handlers for Reminders
export const fetchReminders = async (): Promise<Reminder[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    
    const q = query(remindersCol, where("ownerId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      let date = new Date();
      
      if (data.date) {
        if (typeof data.date === 'object' && 'seconds' in data.date) {
          date = new Date(data.date.seconds * 1000);
        } else {
          try {
            date = new Date(data.date);
          } catch (e) {
            console.error("Invalid reminder date format:", data.date);
          }
        }
      }
      
      return { id: doc.id, ...data, date } as Reminder;
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    throw error;
  }
};

export const subscribeToReminders = (callback: (reminders: Reminder[]) => void) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No authenticated user for reminders subscription");
      callback([]);
      return () => {};
    }
    
    console.log("Setting up reminders subscription for user:", currentUser.uid);
    const q = query(remindersCol, where("ownerId", "==", currentUser.uid));
    
    return onSnapshot(q, snapshot => {
      const reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = new Date();
        
        if (data.date) {
          if (typeof data.date === 'object' && 'seconds' in data.date) {
            date = new Date(data.date.seconds * 1000);
          } else {
            try {
              date = new Date(data.date);
            } catch (e) {
              console.error("Invalid reminder date format:", data.date);
            }
          }
        }
        
        console.log("Processed reminder:", { id: doc.id, ...data, date });
        return { id: doc.id, ...data, date } as Reminder;
      });
      console.log("Reminders subscription updated:", reminders.length, "reminders");
      callback(reminders);
    }, error => {
      console.error("Error subscribing to reminders:", error);
    });
  } catch (error) {
    console.error("Error setting up reminders subscription:", error);
    return () => {}; // Return empty function in case of error
  }
};

export const addReminder = async (reminder: Omit<Reminder, 'id' | 'completed'>): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");

    const reminderWithOwner = {
      ...reminder,
      ownerId: currentUser.uid,
      completed: false
    };
    
    const docRef = await addDoc(remindersCol, reminderWithOwner);
    return docRef.id;
  } catch (error) {
    console.error("Error adding reminder:", error);
    throw error;
  }
};

export const updateReminder = async (reminder: Reminder): Promise<void> => {
  try {
    const docRef = doc(db, 'reminders', reminder.id);
    await setDoc(docRef, reminder, { merge: true });
  } catch (error) {
    console.error("Error updating reminder:", error);
    throw error;
  }
};

// Previous tenants functionality moved to building units
// No separate collection needed