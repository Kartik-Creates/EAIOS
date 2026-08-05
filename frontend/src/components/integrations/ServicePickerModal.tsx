import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { PROVIDERS } from '@/constants/providers';
import { staggerContainer, staggerItem } from '@/lib/motion';
import './ServicePickerModal.css';

interface ServicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProviders: string[];
  onAddProvider: (providerId: string) => void;
}

export const ServicePickerModal = ({ isOpen, onClose, activeProviders, onAddProvider }: ServicePickerModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const availableProviders = useMemo(() => {
    return PROVIDERS.filter((p) => !activeProviders.includes(p.id));
  }, [activeProviders]);

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return availableProviders;
    const query = searchQuery.toLowerCase();
    return availableProviders.filter((p) => p.label.toLowerCase().includes(query));
  }, [availableProviders, searchQuery]);

  const handleSelect = (providerId: string) => {
    onAddProvider(providerId);
    setSearchQuery('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Integration" className="service-picker-modal">
      <div className="service-picker-step">
        <div className="service-picker-step-header">
          <h3 className="service-picker-step-title">Choose Service</h3>
          <p className="service-picker-step-desc">
            Select the service you want to integrate with.
          </p>
        </div>

        <div className="service-picker-search">
          <Search size={16} className="service-picker-search-icon" />
          <input
            type="text"
            className="service-picker-search-input"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="service-picker-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="service-picker-list">
          {filteredProviders.length === 0 ? (
            <div className="service-picker-empty">
              {availableProviders.length === 0 ? (
                <p>All available services have been added.</p>
              ) : (
                <p>No services match your search.</p>
              )}
            </div>
          ) : (
            <motion.div className="service-picker-grid" variants={staggerContainer} initial="rest" animate="animate">
              <AnimatePresence>
                {filteredProviders.map((provider) => (
                  <motion.button
                    key={provider.id}
                    type="button"
                    className="service-picker-option"
                    variants={staggerItem}
                    onClick={() => handleSelect(provider.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="service-picker-option-label">{provider.label}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Modal>
  );
};
