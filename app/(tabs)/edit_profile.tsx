import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const POPULAR_TAGS = ['keyword', 'keyword', 'keyword', 'keyword', 'keyword'];
const INITIAL_TAGS = ['keyword', 'keyword', 'keyword', 'keyword', 'keyword'];

export default function EditProfile() {
  const [businessName, setBusinessName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('business@gmail.com');
  const [phone, setPhone] = useState('(123) 456-7890');
  const [website, setWebsite] = useState('');
  const [story, setStory] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>(INITIAL_TAGS);
  const [customTag, setCustomTag] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag) {
      setVibeTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  };

  const removeTag = (index: number) => {
    setVibeTags(prev => prev.filter((_, i) => i !== index));
  };

  const addPopularTag = (tag: string) => {
    setVibeTags(prev => [...prev, tag]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Business Profile</Text>
        <TouchableOpacity style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Business Name */}
        <Text style={styles.label}>
          Business Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type Name..."
          placeholderTextColor="#999"
          value={businessName}
          onChangeText={setBusinessName}
        />

        {/* Short Description */}
        <Text style={styles.label}>
          Short Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type description..."
          placeholderTextColor="#999"
          value={shortDescription}
          onChangeText={text => {
            if (text.length <= 100) setShortDescription(text);
          }}
          maxLength={100}
        />
        <Text style={styles.charCount}>{shortDescription.length}/100 characters</Text>

        {/* Location */}
        <Text style={styles.label}>
          Location <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type Location..."
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="business@gmail.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="(123) 456-7890"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          placeholder="Type Website..."
          placeholderTextColor="#999"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
        />

        {/* Your Story */}
        <Text style={styles.sectionTitle}>Your Story</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Type description..."
          placeholderTextColor="#999"
          value={story}
          onChangeText={setStory}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>Share what makes your business special</Text>

        {/* Vibe Tags */}
        <Text style={styles.sectionTitle}>Vibe Tags</Text>
        <View style={styles.tagsContainer}>
          {vibeTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tag}
              onPress={() => removeTag(index)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Select from popular tags:</Text>
        <View style={styles.tagsContainer}>
          {POPULAR_TAGS.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.popularTag}
              onPress={() => addPopularTag(tag)}
            >
              <Text style={styles.popularTagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Add custom tag:</Text>
        <View style={styles.customTagRow}>
          <TextInput
            style={[styles.input, styles.customTagInput]}
            placeholder="Enter custom tag..."
            placeholderTextColor="#999"
            value={customTag}
            onChangeText={setCustomTag}
            onSubmitEditing={addCustomTag}
          />
          <TouchableOpacity style={styles.addTagBtn} onPress={addCustomTag}>
            <Text style={styles.addTagBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Social Media */}
        <Text style={styles.sectionTitle}>Social Media</Text>

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          style={styles.input}
          placeholder="type..."
          placeholderTextColor="#999"
          value={instagram}
          onChangeText={setInstagram}
          autoCapitalize="none"
        />

        <Text style={styles.label}>TikTok</Text>
        <TextInput
          style={styles.input}
          placeholder="type..."
          placeholderTextColor="#999"
          value={tiktok}
          onChangeText={setTiktok}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Facebook</Text>
        <TextInput
          style={styles.input}
          placeholder="type..."
          placeholderTextColor="#999"
          value={facebook}
          onChangeText={setFacebook}
          autoCapitalize="none"
        />

        {/* Save Changes */}
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_BG = '#ebebeb';
const RADIUS = 12;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111' },
  saveHeaderBtn: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveHeaderText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Section Title
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111',
    marginTop: 24,
    marginBottom: 12,
  },

  // Labels
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 14,
  },
  required: { color: '#e53e3e' },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 14,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },

  // Inputs
  input: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  popularTag: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  popularTagText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },

  // Custom Tag Row
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    marginTop: 0,
  },
  addTagBtn: {
    backgroundColor: '#333',
    borderRadius: RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addTagBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Save Button
  saveBtn: {
    backgroundColor: '#333',
    borderRadius: RADIUS,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
