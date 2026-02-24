import React, { useState } from 'react';
import PostTypeModal from './PostTypeModal';
import PropertyCategoryModal from './PropertyCategoryModal';
import RequirementWizard from '../forms/RequirementWizard';
import ListingWizard from '../forms/ListingWizard';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('type');
  const [postType, setPostType] = useState(null);
  const [category, setCategory] = useState(null);

  const handleSelectType = (type) => {
    setPostType(type);
    setStep('category');
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setStep('form');
  };

  const handleWizardClose = (reason) => {
    if (reason === 'back') {
      if (step === 'form') setStep('category');
      else if (step === 'category') { setStep('type'); setPostType(null); }
      else onClose();
    } else {
      onClose();
    }
  };

  if (step === 'type') {
    return <PostTypeModal onClose={onClose} onSelectType={handleSelectType} />;
  }

  if (step === 'category') {
    return (
      <PropertyCategoryModal
        onClose={onClose}
        onSelectCategory={handleSelectCategory}
        onBack={() => { setStep('type'); setPostType(null); }}
        postType={postType}
      />
    );
  }

  if (step === 'form' && postType === 'requirement') {
    return <RequirementWizard category={category} onClose={handleWizardClose} onSuccess={onSuccess} />;
  }

  if (step === 'form' && postType === 'listing') {
    return <ListingWizard category={category} onClose={handleWizardClose} onSuccess={onSuccess} />;
  }

  return null;
}