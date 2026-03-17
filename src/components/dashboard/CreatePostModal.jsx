import React, { useState } from 'react';
import PostTypeModal from './PostTypeModal';
import PropertyCategoryModal from './PropertyCategoryModal';
import RequirementWizard from '../forms/RequirementWizard';
import ListingWizard from '../forms/ListingWizard';
import LoadTemplateModal from '../templates/LoadTemplateModal';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('type');
  const [postType, setPostType] = useState(null);
  const [category, setCategory] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);

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
      if (step === 'form') { setStep('category'); setInitialData(null); }
      else if (step === 'category') { setStep('type'); setPostType(null); }
      else onClose();
    } else {
      onClose();
    }
  };

  const handleLoadTemplate = ({ data, templateType, category: cat }) => {
    setInitialData(data);
    setPostType(templateType);
    setCategory(cat || data.property_category);
    setShowLoadTemplate(false);
    setStep('form');
  };

  if (showLoadTemplate) {
    return <LoadTemplateModal onClose={() => setShowLoadTemplate(false)} onLoad={handleLoadTemplate} />;
  }

  if (step === 'type') {
    return <PostTypeModal onClose={onClose} onSelectType={handleSelectType} onLoadTemplate={() => setShowLoadTemplate(true)} />;
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
    return <RequirementWizard category={category} onClose={handleWizardClose} onSuccess={onSuccess} initialData={initialData} />;
  }

  if (step === 'form' && postType === 'listing') {
    return <ListingWizard category={category} onClose={handleWizardClose} onSuccess={onSuccess} initialData={initialData} />;
  }

  return null;
}