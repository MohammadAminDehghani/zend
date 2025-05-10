export type Interest = {
  id: string;
  label: string;
  category: 'lifestyle' | 'entertainment' | 'professional' | 'other';
};

export const INTERESTS: Interest[] = [
  // Lifestyle
  { id: 'sports', label: 'Sports', category: 'lifestyle' },
  { id: 'fitness', label: 'Fitness', category: 'lifestyle' },
  { id: 'health', label: 'Health', category: 'lifestyle' },
  { id: 'cooking', label: 'Cooking', category: 'lifestyle' },
  { id: 'fashion', label: 'Fashion', category: 'lifestyle' },
  
  // Entertainment
  { id: 'music', label: 'Music', category: 'entertainment' },
  { id: 'movies', label: 'Movies', category: 'entertainment' },
  { id: 'gaming', label: 'Gaming', category: 'entertainment' },
  { id: 'reading', label: 'Reading', category: 'entertainment' },
  { id: 'photography', label: 'Photography', category: 'entertainment' },
  
  // Professional
  { id: 'technology', label: 'Technology', category: 'professional' },
  { id: 'business', label: 'Business', category: 'professional' },
  { id: 'education', label: 'Education', category: 'professional' },
  
  // Other
  { id: 'art', label: 'Art', category: 'other' },
  { id: 'travel', label: 'Travel', category: 'other' },
  { id: 'nature', label: 'Nature', category: 'other' },
  { id: 'dance', label: 'Dance', category: 'other' },
];

export const getInterestsByCategory = (category: Interest['category']) => 
  INTERESTS.filter(interest => interest.category === category); 