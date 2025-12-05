/**
 * Processes a raw image URL into a Polaroid-style framed image (Base64) with optional text.
 */
export const createPolaroidFrame = (
  imageUrl: string,
  text: string = "",
  width: number = 600 // High res width
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Ensure font is loaded before drawing text (rudimentary check, mostly relies on browser cache or preload)
      document.fonts.ready.then(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Polaroid Dimensions Ratio
        // Frame width: 1.0
        // Frame height: 1.25
        const frameWidth = width;
        const frameHeight = width * 1.25;
        const padding = width * 0.08;
        const photoWidth = frameWidth - (padding * 2);
        const photoHeight = photoWidth; // Square aspect for the inner photo

        canvas.width = frameWidth;
        canvas.height = frameHeight;

        // 1. Draw Paper
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Shadow for inner photo depth
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(padding, padding, photoWidth, photoHeight);

        // 3. Draw the Image (Center Crop)
        const sourceAspect = img.width / img.height;
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

        if (sourceAspect > 1) {
          // Wide image: crop sides
          sWidth = img.height;
          sx = (img.width - img.height) / 2;
        } else {
          // Tall image: crop top/bottom
          sHeight = img.width;
          sy = (img.height - img.width) / 2;
        }

        ctx.drawImage(
          img,
          sx, sy, sWidth, sHeight, // Source crop
          padding, padding, photoWidth, photoHeight // Destination
        );

        // 4. Inner border for crispness
        ctx.strokeStyle = "#e5e5e5";
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, photoWidth, photoHeight);

        // 5. Draw Caption Text
        if (text && text.trim().length > 0) {
          // Setup Font
          // Scale font size based on canvas width
          const fontSize = Math.floor(width * 0.1); 
          ctx.font = `${fontSize}px 'Caveat', cursive`;
          ctx.fillStyle = "#374151"; // Dark gray like a marker
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Calculate center of the bottom white space
          const bottomAreaTop = padding + photoHeight;
          const bottomAreaHeight = frameHeight - bottomAreaTop;
          const textX = frameWidth / 2;
          const textY = bottomAreaTop + (bottomAreaHeight / 2) + (fontSize * 0.1); // Slight adjustment

          ctx.fillText(text, textX, textY, frameWidth - (padding * 2));
        }

        resolve(canvas.toDataURL("image/png"));
      });
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
};