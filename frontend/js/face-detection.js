// Simple face detection utilities
class FaceDetection {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.previousFrame = null;
        this.faceRegions = [];
    }

    async detectFaces(videoElement) {
        this.canvas.width = videoElement.videoWidth;
        this.canvas.height = videoElement.videoHeight;
        this.ctx.drawImage(videoElement, 0, 0);
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        return {
            faceCount: this.countFaces(imageData),
            facePresent: this.isFacePresent(imageData),
            multipleFaces: this.hasMultipleFaces(imageData),
            motionDetected: this.detectMotion(imageData)
        };
    }

    countFaces(imageData) {
        const skinRegions = this.detectSkinRegions(imageData);
        const faceRegions = this.groupSkinRegions(skinRegions);
        
        // Filter regions by size and aspect ratio to better identify faces
        const validFaceRegions = faceRegions.filter(region => {
            const bounds = this.getRegionBounds(region);
            const width = bounds.maxX - bounds.minX;
            const height = bounds.maxY - bounds.minY;
            const aspectRatio = width / height;
            
            // Face should have reasonable dimensions and aspect ratio
            return region.length > 500 && // Minimum pixels for a face
                   width > 30 && height > 30 && // Minimum dimensions
                   aspectRatio > 0.6 && aspectRatio < 1.8; // Face-like aspect ratio
        });
        
        return validFaceRegions.length;
    }

    isFacePresent(imageData) {
        const brightness = this.calculateAverageBrightness(imageData);
        const skinPixels = this.countSkinPixels(imageData);
        
        // Face present if reasonable brightness and skin pixels
        return brightness > 30 && brightness < 200 && skinPixels > 1000;
    }

    hasMultipleFaces(imageData) {
        const faceCount = this.countFaces(imageData);
        console.log('Face count detected:', faceCount);
        return faceCount > 1;
    }

    detectMotion(imageData) {
        if (!this.previousFrame) {
            this.previousFrame = imageData;
            return true;
        }

        const motionLevel = this.calculateFrameDifference(this.previousFrame, imageData);
        this.previousFrame = imageData;
        
        return motionLevel > 10; // Threshold for motion detection
    }

    detectSkinRegions(imageData) {
        const data = imageData.data;
        const skinPixels = [];
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (this.isSkinColor(r, g, b)) {
                const x = (i / 4) % imageData.width;
                const y = Math.floor((i / 4) / imageData.width);
                skinPixels.push({ x, y });
            }
        }
        
        return skinPixels;
    }

    isSkinColor(r, g, b) {
        // Improved skin color detection
        return (r > 95 && g > 40 && b > 20 &&
                Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                Math.abs(r - g) > 15 && r > g && r > b) ||
               (r > 220 && g > 210 && b > 170 &&
                Math.abs(r - g) <= 15 && r > b && g > b);
    }

    groupSkinRegions(skinPixels) {
        const regions = [];
        const visited = new Set();
        
        for (const pixel of skinPixels) {
            const key = `${pixel.x},${pixel.y}`;
            if (visited.has(key)) continue;
            
            const region = this.floodFill(skinPixels, pixel, visited);
            if (region.length > 200) { // Increased minimum region size
                regions.push(region);
            }
        }
        
        return regions;
    }

    floodFill(skinPixels, startPixel, visited) {
        const region = [];
        const stack = [startPixel];
        const pixelMap = new Map();
        
        // Create pixel map for faster lookup
        skinPixels.forEach(p => {
            pixelMap.set(`${p.x},${p.y}`, p);
        });
        
        while (stack.length > 0) {
            const pixel = stack.pop();
            const key = `${pixel.x},${pixel.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            region.push(pixel);
            
            // Check 8-connected neighbors
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const neighborKey = `${pixel.x + dx},${pixel.y + dy}`;
                    if (pixelMap.has(neighborKey) && !visited.has(neighborKey)) {
                        stack.push(pixelMap.get(neighborKey));
                    }
                }
            }
        }
        
        return region;
    }

    getRegionBounds(region) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        region.forEach(pixel => {
            minX = Math.min(minX, pixel.x);
            maxX = Math.max(maxX, pixel.x);
            minY = Math.min(minY, pixel.y);
            maxY = Math.max(maxY, pixel.y);
        });
        
        return { minX, maxX, minY, maxY };
    }

    calculateAverageBrightness(imageData) {
        const data = imageData.data;
        let totalBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalBrightness += (r + g + b) / 3;
        }
        
        return totalBrightness / (data.length / 4);
    }

    countSkinPixels(imageData) {
        const data = imageData.data;
        let skinPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (this.isSkinColor(r, g, b)) {
                skinPixels++;
            }
        }
        
        return skinPixels;
    }

    calculateFrameDifference(frame1, frame2) {
        const data1 = frame1.data;
        const data2 = frame2.data;
        let totalDiff = 0;
        
        for (let i = 0; i < data1.length; i += 4) {
            const diff = Math.abs(data1[i] - data2[i]) +
                        Math.abs(data1[i + 1] - data2[i + 1]) +
                        Math.abs(data1[i + 2] - data2[i + 2]);
            totalDiff += diff;
        }
        
        return totalDiff / (data1.length / 4);
    }
}

window.FaceDetection = FaceDetection;