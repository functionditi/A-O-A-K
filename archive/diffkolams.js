draw() {
    this.pg.clear();

    let age = millis() - this.creationTime;

    if (age > 20000 && !this.dispersing) {  
        this.dispersing = true;  
        this.dispersalStartTime = millis(); // Mark the start of dispersal
    }

    for (let i = 0; i < this.tnumber; i++) {
        for (let j = 0; j < this.tnumber; j++) {
          if((i+j)%2==0 || (i+j)%2==1){
          // If you've introduced open spaces, skip tiles marked as “open”.
          if (this.nlink[i][j] === 0) continue;

          let tileX = this.offsetX + i * this.tsize + this.margin;
          let tileY = this.offsetY + j * this.tsize + this.margin;
          let maxRadius = this.tsize / 2; // Full curvature

          // Get the state for each vertex. Note that our grid of vertices is (tnumber+1) x (tnumber+1)
          let state_tl = getCornerState(i,     j,     this.tnumber);
          let state_tr = getCornerState(i + 1, j,     this.tnumber);
          let state_br = getCornerState(i + 1, j + 1, this.tnumber);
          let state_bl = getCornerState(i,     j + 1, this.tnumber);

          // Set the radii based on the state: 1 means fully curved, 0 means square.
          let r_topLeft     = state_tl ? maxRadius : 0;
          let r_topRight    = state_tr ? maxRadius : 0;
          let r_bottomRight = state_br ? maxRadius : 0;
          let r_bottomLeft  = state_bl ? maxRadius : 0;

          // Now choose colors based on your logic (here we simply use activeColor; adjust as desired)
          let c1 = this.activeColor;
          let c2 = this.gradientA; // Or any gradient scheme you want

          // For example, if you want to apply a gradient only if all corners are 0 (i.e. a square)
          if (r_topLeft === 0 && r_topRight === 0 && r_bottomRight === 0 && r_bottomLeft === 0) {
            drawGradientRect(this.pg, tileX, tileY, this.tsize, this.tsize, c1, c2);
          } else {
            // Otherwise, draw the rectangle with rounded corners as defined.
            this.pg.fill(c1);
            this.pg.noStroke();
            this.pg.rect(tileX, tileY, this.tsize, this.tsize,
                        r_topLeft, r_topRight, r_bottomRight, r_bottomLeft);
            // Optionally add a stroke.
            this.pg.stroke(this.strokeColor);
            this.pg.strokeWeight(thickness * 0.6);
            this.pg.noFill();
            this.pg.rect(tileX, tileY, this.tsize, this.tsize,
                        r_topLeft, r_topRight, r_bottomRight, r_bottomLeft);
          }

          // Optionally, draw a center point.
          this.pg.stroke("white");
          this.pg.strokeWeight(thickness * 1.3);
          this.pg.point(tileX + this.tsize / 2, tileY + this.tsize / 2);
        }
      }
      }



    this.idx += 0.02;
    this.idx = constrain(this.idx, 0, 1);
}




draw() {
    this.pg.clear();

    let age = millis() - this.creationTime;

    if (age > 20000 && !this.dispersing) {  
        this.dispersing = true;  
        this.dispersalStartTime = millis(); // Mark the start of dispersal
    }

    for (let i = 0; i < this.tnumber; i++) {
        for (let j = 0; j < this.tnumber; j++) {
            if ((i + j) % 2 === 0) {
                let tileX = this.offsetX + i * this.tsize + this.margin;
                let tileY = this.offsetY + j * this.tsize + this.margin;

                if (this.dispersing) {
                    let elapsed = millis() - this.dispersalStartTime;
                    if (elapsed > this.tileDispersalTimes[i][j]) {
                        continue; // Skip drawing this tile if it's time to disappear
                    }
                }

                let r_topLeft = (this.tsize / 2) * lerp(this.link[i][j], this.nlink[i][j], this.idx);
                let r_topRight = (this.tsize / 2) * lerp(this.link[i+1][j], this.nlink[i+1][j], this.idx);
                let r_bottomRight = (this.tsize / 2) * lerp(this.link[i+1][j+1], this.nlink[i+1][j+1], this.idx);
                let r_bottomLeft = (this.tsize / 2) * lerp(this.link[i][j+1], this.nlink[i][j+1], this.idx);

                let state = this.nlink[i][j]; 

                // Determine colors
                let c1, c2;
                if (state === 1) {
                    c1 = this.activeColor;
                    c2 = this.gradientA;
                } else {
                    c1 = this.fillColor;
                    c2 = this.gradientB;
                }

                if (r_topLeft === 0 && r_topRight === 0 && r_bottomRight === 0 && r_bottomLeft === 0) {
                    // **Apply gradient only if it's a square tile**
                   
                    drawGradientRect(this.pg, tileX, tileY, this.tsize, this.tsize, c1, c2);
                    
                } else {
                    // **Apply flat fill only if it's not a square**
                    this.pg.fill(c1);
                    this.pg.noStroke();
                    this.pg.rect(tileX, tileY, this.tsize, this.tsize, r_topLeft, r_topRight, r_bottomRight, r_bottomLeft);
                    this.pg.stroke(this.strokeColor);
                    this.pg.strokeWeight(thickness * 0.6);
                    this.pg.noFill(); // Ensures stroke doesn't override the gradient
                    this.pg.rect(tileX, tileY, this.tsize, this.tsize, r_topLeft, r_topRight, r_bottomRight, r_bottomLeft);

                }

                // Draw stroke around all tiles
               
                // Draw center point
                this.pg.stroke("white");
                this.pg.strokeWeight(thickness * 1.3);
                this.pg.point(tileX + this.tsize / 2, tileY + this.tsize / 2);
            }
        }
    }

    this.idx += 0.02;
    this.idx = constrain(this.idx, 0, 1);
}



