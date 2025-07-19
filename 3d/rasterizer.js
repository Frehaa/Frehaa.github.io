function rasterizer_test_main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const a = new Vec2(100, 100);
    const b = new Vec2(200, 150);
    const c = new Vec2(50, 300);

    const colorA = new RasterizerColor(1, 0, 0);
    const colorB = new RasterizerColor(0, 1, 0);
    const colorC = new RasterizerColor(0, 1, 1);
    
    Rasterizer.drawTriangle(imageData, a, b, c, colorA, colorB, colorC)

    Rasterizer.drawLine(imageData, a, b, colorA);
    Rasterizer.drawLine(imageData, b, c, colorB);
    Rasterizer.drawLine(imageData, c, a, colorC);

    ctx.putImageData(imageData, 0, 0);
}
class RasterizerColor {
    constructor(red, green, blue) {
        assert(0 <= red && red <= 1 && 0 <= green && green <= 1 && 0 <= blue && blue <= 1, "Color values should be in range [0, 1].");
        this.r = red;   
        this.g = green;   
        this.b = blue;   
    }

    scale(scalar) {
        const newRed = clamp(this.r * scalar, 0, 1);
        const newGreen = clamp(this.g * scalar, 0, 1);
        const newBlue = clamp(this.b * scalar, 0, 1);
        
        return new RasterizerColor(newRed, newGreen, newBlue);
    }

    add(b) {
        const newRed = clamp(this.r + b.r, 0, 1);
        const newGreen = clamp(this.g + b.g, 0, 1);
        const newBlue = clamp(this.b + b.b, 0, 1);
        return new RasterizerColor(newRed, newGreen, newBlue);
    }
}

// objects -> camera -> canvas (draw-buffer + z-buffer) -> [lights] -> draw-buffer


function rasterize(imageData, triangles) {
    

}

class Rasterizer {
    constructor(imageData) {}
    // Based on second triangle rasterization algorithm of "Fundamentals of Computer Graphics" in section 8.1.2
    static drawTriangle(imageData, a, b, c, colorA, colorB, colorC) {
        const xMin = Math.min(a.x, b.x, c.x);
        const xMax = Math.max(a.x, b.x, c.x);
        const yMin = Math.min(a.y, b.y, c.y);
        const yMax = Math.max(a.y, b.y, c.y);

        const f01 = (x, y) => {
            return (a.y - b.y)*x + (b.x - a.x) * y + a.x * b.y - b.x * a.y

        }
        const f12 = (x, y) => {
            return (b.y - c.y)*x + (c.x - b.x) * y + b.x * c.y - c.x * b.y
        }
        const f20 = (x, y) => {
            return (c.y - a.y)*x + (a.x - c.x) * y + c.x * a.y - a.x * c.y
        }

        for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
                const alpha = f12(x, y) / f12(a.x, a.y);
                const beta = f20(x, y) / f20(b.x, b.y);
                const gamma = f01(x, y) / f01(c.x, c.y);

                if (alpha > 0 && beta > 0 && gamma > 0) {
                    const color = colorA.scale(alpha).add(colorB.scale(beta)).add(colorC.scale(gamma));
                    imageData.setPixel(x, y, color.r * 255, color.g * 255, color.b * 255, 255);
                }
            }
        }
    }
    // This clearly doesn't work because I do not respect the original points. I end up changing the position of the start and end of the line if I just naively take the min and max like this. 
    static drawLine(imageData, a, b, color) {
        const red = color.r * 255;
        const green = color.g * 255;
        const blue = color.b * 255;

        const x0 = Math.min(a.x, b.x);
        const x1 = Math.max(a.x, b.x);
        const deltaX = x1 - x0;
        const y0 = Math.min(a.y, b.y);
        const y1 = Math.max(a.y, b.y);
        const deltaY = y1 - y0;

        if (deltaX > deltaY) {
            const slope = deltaY / deltaX;
            let y = y0;
            let d = 0;
            for (let x = x0; x <= x1; x++) {
                imageData.setPixel(x, y, red, green, blue, 255);
                d += slope;
                if (d >= 1) {
                    y += 1;
                    d -= 1;
                }
            }
        } else {
            const slope = deltaX / deltaY;
            let x = x0;
            let d = 0;
            for (let y = y0; y <= y1; y++) {
                imageData.setPixel(x, y, red, green, blue, 255);
                d += slope;
                if (d >= 1) {
                    x += 1;
                    d -= 1;
                }
            }
        }

    }

}




