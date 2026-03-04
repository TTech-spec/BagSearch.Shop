import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/api';
import { AuthContext } from './context/AuthContext';

const MS = ({ name, className = '', size = 22 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontSize: size, fontVariationSettings: "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24" }}
  >
    {name}
  </span>
);

export default function CreateProduct() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    condition: 'Pristine (Like New)',
    description: '',
    price: '',
  });

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) {
      alert('You can only upload up to 10 photos');
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to list a product');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedImageUrls = [];

      for (const img of images) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, img.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert([
          {
            user_id: user.id,
            name: formData.name,
            brand: formData.brand,
            category: formData.category,
            condition: formData.condition,
            description: formData.description,
            price: formData.price || '0',
            images: uploadedImageUrls,
            seller_name: user.user_metadata?.full_name || 'Anonymous Seller',
          }
        ]);

      if (insertError) throw insertError;

      navigate('/products');
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: 'Manrope', sans-serif; }
      `}</style>

      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 md:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4 text-gray-900 cursor-pointer" onClick={() => navigate('/products')}>
            <div className="size-6 text-blue-600">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight">BagMarket</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/seller-profile')} className="hidden sm:flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-blue-600 text-white text-sm font-bold">
            Profile
          </button>
        </div>
      </header>

      <main className="max-w-[960px] mx-auto py-8 px-4 flex flex-col gap-6">
        <nav className="flex gap-2 text-sm text-gray-500">
          <a className="hover:underline" href="#" onClick={(e) => { e.preventDefault(); navigate('/seller-profile'); }}>Dashboard</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">List a Bag</span>
        </nav>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-gray-900">List Your Bag</h1>
          <p className="text-gray-500 max-w-2xl">
            Fill in the details below to help buyers find your product. Our AI visual search indexes your bag's photos for better visibility.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-900 text-base font-bold">Step 1: Product Details</p>
                <p className="text-gray-500 text-sm">Next: Pricing & Shipping</p>
              </div>
              <p className="text-blue-600 text-sm font-bold bg-blue-50 px-3 py-1 rounded-full">33% Complete</p>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload Images</h2>
              <MS name="info" className="text-blue-600 text-lg cursor-help" />
            </div>
            
            <div 
              className="group relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-600 bg-gray-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                ref={fileInputRef}
                className="hidden" 
                multiple 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="size-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MS name="cloud_upload" size={40} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Drag and drop or click to upload</p>
                  <p className="text-sm text-gray-500">Add up to 10 photos (Front, Back, Inside, Serial Number)</p>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                {images.map((img, index) => (
                  <div key={index} className="aspect-square rounded-lg border border-gray-300 relative group overflow-hidden">
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MS name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Bag Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full h-11 rounded-lg border border-gray-300 focus:ring-blue-600 focus:border-blue-600 px-4" 
                placeholder="e.g., Chanel Classic Flap Caviar" 
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Brand</label>
              <select 
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                className="w-full h-11 rounded-lg border border-gray-300 focus:ring-blue-600 focus:border-blue-600 px-4"
              >
                <option value="">Select a brand</option>
                <option>Chanel</option>
                <option>Hermès</option>
                <option>Louis Vuitton</option>
                <option>Gucci</option>
                <option>Prada</option>
                <option>Dior</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Category</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full h-11 rounded-lg border border-gray-300 focus:ring-blue-600 focus:border-blue-600 px-4"
              >
                <option value="">Select category</option>
                <option>Handbags</option>
                <option>Shoulder Bags</option>
                <option>Clutches</option>
                <option>Totes</option>
                <option>Backpacks</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Condition</label>
              <select 
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                required
                className="w-full h-11 rounded-lg border border-gray-300 focus:ring-blue-600 focus:border-blue-600 px-4"
              >
                <option>Pristine (Like New)</option>
                <option>Excellent (Minor Wear)</option>
                <option>Very Good (Gentle Use)</option>
                <option>Fair (Visible Wear)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-900">Price ($)</label>
              <input 
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full h-11 rounded-lg border border-gray-300 focus:ring-blue-600 focus:border-blue-600 px-4" 
                placeholder="e.g., 2500" 
                type="number"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-900">Description</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <button type="button" className="p-1 hover:bg-gray-200 rounded"><MS name="format_bold" size={20} /></button>
                  <button type="button" className="p-1 hover:bg-gray-200 rounded"><MS name="format_italic" size={20} /></button>
                  <button type="button" className="p-1 hover:bg-gray-200 rounded"><MS name="format_list_bulleted" size={20} /></button>
                </div>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full border-none focus:ring-0 text-gray-900 text-base px-4 py-3 resize-none" 
                  placeholder="Mention any wear and tear, material details, and when/where it was purchased..." 
                  rows="6"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <MS name="chat" size={20} />
              <p className="text-xs font-medium">Get live updates via WhatsApp</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                type="button"
                onClick={() => navigate('/seller-profile')}
                className="flex-1 sm:flex-none px-6 h-11 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={uploading}
                className="flex-1 sm:flex-none px-10 h-11 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'List Product'}
                {!uploading && <MS name="arrow_forward" size={18} />}
              </button>
            </div>
          </div>
        </form>

        <footer className="mt-8 mb-12 flex flex-col items-center gap-2">
          <p className="text-gray-500 text-sm">Need help? Chat with us on <a className="text-blue-600 font-bold" href="#">WhatsApp Support</a></p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Authentication Guide</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

