import { InputValidator } from './inputValidation';

// Secure file upload utilities
export class SecureFileUpload {
  
  private static readonly ALLOWED_FILE_TYPES = {
    text: ['txt'],
    document: ['docx'],
    audio: ['mp3', 'wav', 'm4a']
  };
  
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  private static readonly DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 
    'sh', 'py', 'php', 'asp', 'aspx', 'jsp', 'pl', 'cgi'
  ];
  
  // Validate file before processing
  static validateFile(file: File): { isValid: boolean; error?: string } {
    try {
      // Check if file exists
      if (!file) {
        return { isValid: false, error: 'No file provided' };
      }
      
      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return { 
          isValid: false, 
          error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB` 
        };
      }
      
      // Get file extension
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();
      
      if (!fileExtension) {
        return { isValid: false, error: 'File must have an extension' };
      }
      
      // Check for dangerous extensions  
      if (this.DANGEROUS_EXTENSIONS.includes(fileExtension)) {
        return { isValid: false, error: 'File type not allowed for security reasons' };
      }
      
      // Check if extension is in allowed list
      const allAllowedTypes = Object.values(this.ALLOWED_FILE_TYPES).flat();
      if (!allAllowedTypes.includes(fileExtension)) {
        return { 
          isValid: false, 
          error: `File type '${fileExtension}' not supported. Allowed: ${allAllowedTypes.join(', ')}` 
        };
      }
      
      // Validate MIME type
      const mimeValidation = this.validateMimeType(file, fileExtension);
      if (!mimeValidation.isValid) {
        return mimeValidation;
      }
      
      // Check for null bytes (potential path traversal)
      if (fileName.includes('\\0') || fileName.includes('../') || fileName.includes('..\\')) {
        return { isValid: false, error: 'Invalid file name' };
      }
      
      return { isValid: true };
      
    } catch (error) {
      return { isValid: false, error: 'File validation error' };
    }
  }
  
  // Validate MIME type matches extension
  private static validateMimeType(file: File, extension: string): { isValid: boolean; error?: string } {
    const expectedMimeTypes: Record<string, string[]> = {
      'txt': ['text/plain'],
      'docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      'mp3': ['audio/mpeg', 'audio/mp3'],
      'wav': ['audio/wav', 'audio/wave'],
      'm4a': ['audio/mp4', 'audio/x-m4a']
    };
    
    const allowedMimes = expectedMimeTypes[extension];
    if (!allowedMimes) {
      return { isValid: false, error: 'Unsupported file type' };
    }
    
    if (!allowedMimes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `MIME type '${file.type}' doesn't match file extension '${extension}'` 
      };
    }
    
    return { isValid: true };
  }
  
  // Sanitize filename
  static sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .substring(0, 255); // Limit length
  }
  
  // Read file content safely
  static async readFileContent(file: File): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target?.result || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Determine read method based on file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'txt') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }
  
  // Convert audio file to base64 for API
  static async convertAudioToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to convert audio file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  // Quarantine and scan file (placeholder for virus scanning)
  static async scanForMalware(file: File): Promise<{ isSafe: boolean; reason?: string }> {
    // In a production environment, integrate with a malware scanning service
    // For now, this is a placeholder that performs basic checks
    
    try {
      // Check file signature (magic bytes) for common file types
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 10));
      
      // Basic signature validation
      const isValidSignature = this.validateFileSignature(bytes, file.name);
      
      if (!isValidSignature) {
        return { isSafe: false, reason: 'Invalid file signature' };
      }
      
      // Additional checks can be added here
      // - Integration with ClamAV or similar
      // - Cloud-based scanning services
      // - Behavioral analysis
      
      return { isSafe: true };
      
    } catch (error) {
      return { isSafe: false, reason: 'Scan failed' };
    }
  }
  
  // Validate file signature (magic bytes)
  private static validateFileSignature(bytes: Uint8Array, filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    // Known file signatures
    const signatures: Record<string, number[][]> = {
      'txt': [], // Text files don't have a specific signature
      'docx': [[0x50, 0x4B, 0x03, 0x04]], // ZIP signature (DOCX is ZIP-based)
      'mp3': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2]], // MP3 signatures
      'wav': [[0x52, 0x49, 0x46, 0x46]], // RIFF signature
      'm4a': [[0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]] // M4A signature
    };
    
    if (!extension || !signatures[extension]) {
      return true; // No signature check for unknown types
    }
    
    const expectedSignatures = signatures[extension];
    if (expectedSignatures.length === 0) {
      return true; // No signature required
    }
    
    return expectedSignatures.some(signature => 
      signature.every((byte, index) => bytes[index] === byte)
    );
  }
}

// File processing rate limiter
export class FileProcessingLimiter {
  private static uploads = new Map<string, { count: number; lastReset: number }>();
  private static readonly MAX_UPLOADS_PER_HOUR = 10;
  private static readonly HOUR_IN_MS = 60 * 60 * 1000;
  
  static canUpload(userId: string): boolean {
    const now = Date.now();
    const userUploads = this.uploads.get(userId);
    
    if (!userUploads || now - userUploads.lastReset > this.HOUR_IN_MS) {
      this.uploads.set(userId, { count: 1, lastReset: now });
      return true;
    }
    
    if (userUploads.count >= this.MAX_UPLOADS_PER_HOUR) {
      return false;
    }
    
    userUploads.count++;
    return true;
  }
}
