import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';

import { EventWithBusiness, listMappableEvents } from '@/services/api';

const AUSTIN_REGION: Region = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function formatDayTime(dateStr: string, startTime: string | null): string {
  const d = new Date(dateStr);
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  if (!startTime) return day;
  const [h, m] = startTime.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mins = m ? `:${String(m).padStart(2, '0')}` : '';
  return `${day}, ${h12}${mins} ${period}`;
}

export default function MapScreen() {
  const [events, setEvents] = useState<EventWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventWithBusiness | null>(null);

  useEffect(() => {
    listMappableEvents()
      .then(setEvents)
      .catch((e) => setError(e?.message ?? 'Could not load events.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading pop-ups…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={AUSTIN_REGION}
            showsUserLocation
            showsMyLocationButton
          >
            {events.map((event) => {
              const isSelected = selected?.id === event.id;
              return (
                <Marker
                  key={event.id}
                  coordinate={{ latitude: event.latitude!, longitude: event.longitude! }}
                  tracksViewChanges={false}
                >
                  <TouchableOpacity
                    onPress={() => setSelected(event)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.pin, isSelected && styles.pinSelected]}>
                      <Text style={styles.pinIcon}>☕</Text>
                    </View>
                  </TouchableOpacity>
                </Marker>
              );
            })}
          </MapView>

          {/* Always-visible bottom sheet */}
          <View style={styles.bottomSheet}>
            {!selected ? (
              <Text style={styles.placeholder}>Select a location to start!</Text>
            ) : (
              <View>
                <Text style={styles.eventName}>{selected.event_name}</Text>
                <Text style={styles.businessName}>{selected.business_name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    {formatDayTime(selected.event_date, selected.start_time)}
                  </Text>
                  {selected.location ? (
                    <Text style={styles.metaText}>    {selected.location}</Text>
                  ) : null}
                </View>
                {selected.description ? (
                  <Text style={styles.descText} numberOfLines={2}>
                    {selected.description.split(',').map(s => s.trim()).join(', ')}
                  </Text>
                ) : selected.story ? (
                  <Text style={styles.descText} numberOfLines={2}>{selected.story}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1AD' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: '#FFF1AD' },
  title: { fontSize: 24, fontWeight: '900', color: '#111' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateText: { fontSize: 13, color: '#555' },
  errorText: { fontSize: 13, color: '#b91c1c', fontWeight: '600' },

  mapContainer: { flex: 1 },
  map: { flex: 1 },

  pin: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7AAED6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pinSelected: {
    backgroundColor: '#2E4A7A',
  },
  pinIcon: { fontSize: 20 },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
    minHeight: 100,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 6,
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 17, fontWeight: '600', color: '#888',
    textAlign: 'center',
  },

  eventName: { fontSize: 22, fontWeight: '900', color: '#111', marginBottom: 4 },
  businessName: { fontSize: 13, color: '#555', marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  metaText: { fontSize: 13, color: '#555' },
  descText: { fontSize: 13, color: '#777', lineHeight: 18 },
});
