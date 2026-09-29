# 📱 Mobile Application Integration Guide

## Campus Laundry Slot Booking and Billing System

This guide outlines how the **mobile application** will consume the existing REST API built with FastAPI. Because the backend is architected with decoupled JSON endpoints and OpenAPI documentation, no changes to the backend will be required when building the mobile client.

---

### 1. Backend REST API Contract for Mobile

| Mobile Screen | Action | Endpoint | Method |
| :--- | :--- | :--- | :--- |
| **Login / Profile** | Fetch student profile & past orders | `/api/students/{student_id}` | `GET` |
| **Slot Picker** | Fetch available slots with capacity | `/api/slots/available` | `GET` |
| **Service Menu** | Fetch active services & rates | `/api/services` | `GET` |
| **Booking Submission** | Create reservation & generate pickup code | `/api/bookings` | `POST` |
| **Order Tracking** | Live order status & pickup token | `/api/bookings/{booking_id}` | `GET` |
| **Past History** | List student's booking history | `/api/bookings?student_id={id}` | `GET` |

---

### 2. Sample Mobile Implementation (React Native / Expo)

Below is a ready-to-use React Native screen snippet demonstrating how mobile students can view slots, select items, and submit their booking:

```jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';

const API_BASE_URL = 'http://YOUR_SERVER_IP:8000/api';

export default function MobileLaundryBookingScreen({ studentId = 1 }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/slots/available`)
      .then(res => res.json())
      .then(data => setSlots(data))
      .catch(err => console.error(err));
  }, []);

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      Alert.alert('Required', 'Please select a laundry time slot.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          slot_id: selectedSlot.slot_id,
          items: [{ service_id: 1, quantity: 4 }], // Standard wash 4 items
          payment: { paid_amount: 120.0, payment_method: 'UPI' }
        })
      });

      const result = await response.json();
      if (response.ok) {
        setBookingConfirmed(result);
        Alert.alert('Success!', `Your Pickup Token is: ${result.pickup_code}`);
      } else {
        Alert.alert('Booking Error', result.detail || 'Failed to book');
      }
    } catch (e) {
      Alert.alert('Network Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Book Laundry Slot</Text>
      <FlatList
        data={slots}
        keyExtractor={item => item.slot_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slotCard,
              selectedSlot?.slot_id === item.slot_id && styles.slotCardSelected
            ]}
            onPress={() => setSelectedSlot(item)}
          >
            <Text style={styles.slotDate}>{item.slot_date}</Text>
            <Text style={styles.slotTime}>{item.start_time} - {item.end_time}</Text>
            <Text style={styles.seatsLeft}>{item.available_capacity} seats left</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.bookButton} onPress={handleBookSlot}>
        <Text style={styles.bookButtonText}>Confirm & Generate Token</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0f172a' },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', marginBottom: 15 },
  slotCard: { padding: 16, backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 10 },
  slotCardSelected: { borderColor: '#38bdf8', borderWidth: 2 },
  slotDate: { color: '#94a3b8', fontSize: 12 },
  slotTime: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  seatsLeft: { color: '#34d399', fontSize: 13, marginTop: 4 },
  bookButton: { backgroundColor: '#0284c7', padding: 16, borderRadius: 12, alignItems: 'center' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
```

---

### 3. Progressive Web App (PWA) Option
Before building a native store app, the existing web frontend can also be installed directly on iOS and Android home screens as a PWA with zero app store overhead.
