import React, { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import './App.css'

interface ImageFile {
  id: string
  file: File
  preview: string
}

function App() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [customFileName, setCustomFileName] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'preview'>('grid')
  const [filmStripDragIndex, setFilmStripDragIndex] = useState<number | null>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, GIF, WebP)')
      return
    }

    const newImages: ImageFile[] = imageFiles.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file)
    }))

    setImages(prev => {
      const updated = [...prev, ...newImages]
      // Switch to preview mode when first images are added
      if (prev.length === 0 && updated.length > 0) {
        setViewMode('preview')
        setCurrentImageIndex(0)
      }
      return updated
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      
      // Adjust current index if needed
      const removedIndex = prev.findIndex(img => img.id === id)
      if (removedIndex !== -1 && removedIndex <= currentImageIndex) {
        setCurrentImageIndex(Math.max(0, currentImageIndex - 1))
      }
      
      // Switch to grid mode if no images left
      if (updated.length === 0) {
        setViewMode('grid')
      }
      
      return updated
    })
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      return newImages
    })
  }

  const generatePDF = async () => {
    if (images.length === 0) return

    setIsGenerating(true)
    try {
      const pdf = new jsPDF()
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        
        // Create an image element to get dimensions
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        await new Promise((resolve) => {
          img.onload = () => {
            // Get PDF page dimensions
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 10 // Small margin for better appearance
            
            // Use original image dimensions for canvas to maintain quality
            const originalWidth = img.naturalWidth || img.width
            const originalHeight = img.naturalHeight || img.height
            
            // Set canvas to original image size to preserve quality
            canvas.width = originalWidth
            canvas.height = originalHeight
            
            // Enable high-quality rendering
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            
            // Draw image at original resolution
            ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
            
            // Convert to high-quality data URL
            const imgData = canvas.toDataURL('image/jpeg', 0.95)
            
            // Calculate display dimensions for PDF (maintaining aspect ratio)
            const aspectRatio = originalWidth / originalHeight
            const availableWidth = pageWidth - (margin * 2)
            const availableHeight = pageHeight - (margin * 2)
            
            let displayWidth, displayHeight
            
            if (aspectRatio > availableWidth / availableHeight) {
              // Image is wider relative to available space
              displayWidth = availableWidth
              displayHeight = availableWidth / aspectRatio
            } else {
              // Image is taller relative to available space
              displayHeight = availableHeight
              displayWidth = availableHeight * aspectRatio
            }
            
            // Add new page if not the first image
            if (i > 0) {
              pdf.addPage()
            }
            
            // Center the image on the page
            const x = (pageWidth - displayWidth) / 2
            const y = (pageHeight - displayHeight) / 2

            pdf.addImage(imgData, 'JPEG', x, y, displayWidth, displayHeight)
            resolve(true)
          }
          img.src = image.preview
        })
      }

      // Generate PDF blob
      const pdfBlob = pdf.output('blob')
      const url = URL.createObjectURL(pdfBlob)
      
      // Use custom filename or default
      const fileName = customFileName.trim() 
        ? `${customFileName.trim()}.pdf`
        : `images-${new Date().toISOString().slice(0, 10)}.pdf`
      
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Share API for mobile
      // if (navigator.share && navigator.canShare) {
      //   try {
      //     const file = new File([pdfBlob], 'images.pdf', { type: 'application/pdf' })
      //     if (navigator.canShare({ files: [file] })) {
      //       await navigator.share({
      //         files: [file],
      //         title: 'Generated PDF'
      //       })
      //     }
      //   } catch (shareError) {
      //     console.log('Share cancelled')
      //   }
      // }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
    setViewMode('grid')
    setCurrentImageIndex(0)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverGrid = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderImages(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  // Film strip drag and drop functions
  const handleFilmStripDragStart = (e: React.DragEvent, index: number) => {
    setFilmStripDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFilmStripDragEnd = () => {
    setFilmStripDragIndex(null)
  }

  const handleFilmStripDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (filmStripDragIndex !== null && filmStripDragIndex !== index) {
      // Update current image index if we're dragging the current image
      if (filmStripDragIndex === currentImageIndex) {
        setCurrentImageIndex(index)
      } else if (index === currentImageIndex) {
        setCurrentImageIndex(filmStripDragIndex)
      } else if (filmStripDragIndex < currentImageIndex && index >= currentImageIndex) {
        setCurrentImageIndex(currentImageIndex - 1)
      } else if (filmStripDragIndex > currentImageIndex && index <= currentImageIndex) {
        setCurrentImageIndex(currentImageIndex + 1)
      }
      
      reorderImages(filmStripDragIndex, index)
      setFilmStripDragIndex(index)
    }
  }

  // Navigation functions
  const goToNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const goToPrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'preview' : 'grid')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📄 Image to PDF</h1>
        <p>Convert your images to PDF instantly</p>
      </header>

      <main className="app-main">
        {images.length === 0 ? (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-content">
              <div className="upload-icon">📷</div>
              <h3>Upload Images</h3>
              <p>Drag & drop images here or click to select</p>
              <div className="upload-actions">
                <button 
                  className="btn btn-secondary upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Choose Files
                </button>
                <button 
                  className="btn btn-secondary upload-btn"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  📷 Take Photo
                </button>
              </div>
              <div className="upload-formats">Supports JPG, PNG, GIF, WebP</div>
            </div>
          </div>
        ) : (
          <div className="images-section">
            <div className="section-header">
              <h3>{images.length} Image{images.length !== 1 ? 's' : ''} Selected</h3>
              <div className="header-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={toggleViewMode}
                >
                  {viewMode === 'grid' ? '🖼️ Preview' : '📱 Grid'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add More
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={clearAll}
                >
                  Clear All
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="images-grid">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="image-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOverGrid(e, index)}
                  >
                    <div className="image-preview">
                      <img src={image.preview} alt={`Preview ${index + 1}`} />
                      <button
                        className="remove-btn"
                        onClick={() => removeImage(image.id)}
                        aria-label="Remove image"
                      >
                        × 
                      </button>
                    </div>
                    <div className="image-controls">
                      <span className="image-order">{index + 1}</span>
                      <div className="reorder-buttons">
                        {index > 0 && (
                          <button
                            className="btn-icon"
                            onClick={() => reorderImages(index, index - 1)}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button
                            className="btn-icon"
                            onClick={() => reorderImages(index, index + 1)}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="image-name">{image.file.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="preview-mode">
                <div className="main-preview">
                  <div className="preview-header">
                    <span className="preview-counter">
                      {currentImageIndex + 1} of {images.length}
                    </span>
                    <button
                      className="remove-btn preview-remove"
                      onClick={() => removeImage(images[currentImageIndex].id)}
                      aria-label="Remove current image"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                  
                  <div className="preview-container">
                    <button 
                      className="nav-btn nav-prev"
                      onClick={goToPrevImage}
                      disabled={currentImageIndex === 0}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    
                    <div className="main-image-container">
                      <img 
                        src={images[currentImageIndex]?.preview} 
                        alt={`Preview ${currentImageIndex + 1}`}
                        className="main-image"
                      />
                    </div>
                    
                    <button 
                      className="nav-btn nav-next"
                      onClick={goToNextImage}
                      disabled={currentImageIndex === images.length - 1}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </div>
                  
                  <div className="image-info">
                    <div className="image-name-large">
                      {images[currentImageIndex]?.file.name}
                    </div>
                  </div>
                </div>

                <div className="film-strip">
                  <div className="film-strip-container">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className={`film-strip-item ${index === currentImageIndex ? 'active' : ''} ${filmStripDragIndex === index ? 'dragging' : ''}`}
                        onClick={() => goToImage(index)}
                        draggable
                        onDragStart={(e) => handleFilmStripDragStart(e, index)}
                        onDragEnd={handleFilmStripDragEnd}
                        onDragOver={(e) => handleFilmStripDragOver(e, index)}
                      >
                        <img 
                          src={image.preview} 
                          alt={`Thumbnail ${index + 1}`}
                          className="film-strip-image"
                        />
                        <div className="film-strip-number">{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="filename-section">
              <label htmlFor="filename-input" className="filename-label">
                PDF File Name (optional)
              </label>
              <input
                id="filename-input"
                type="text"
                className="filename-input"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Enter custom filename (without .pdf extension)"
                maxLength={100}
              />
              <div className="filename-preview">
                {customFileName.trim() ? `${customFileName.trim()}.pdf` : `images-${new Date().toISOString().slice(0, 10)}.pdf`}
              </div>
            </div>

            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={generatePDF}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating PDF...' : '📄 Generate PDF'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Success notification */}
      {showSuccess && (
        <div className="success-notification">
          <div className="success-content">
            ✅ PDF generated successfully!
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  )
}

export default App
