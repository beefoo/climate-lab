boolean captureFrames = true;
String outputMovieFile = "frames/frames-#####.png";
int fps = 30;

String refImageDir = "data/ref/frame";

float elapsedMs = 0;
float emissionMsStart = 2000;
float emissionMsEnd = 20000;
float totalMs = 30000;
float frameMs;
int frames;
int particles = 9855;
int particlesPerFrame = 0;
float particleRadius = 4;

ParticleSystem ps;
int particleCount = 0;
Table data;

void setup() {
  size(2036, 512);
  frameRate(fps);
  smooth();
  noStroke();
  colorMode(HSB, 1.0);
  
  ps = new ParticleSystem(particleRadius);
  frameMs = (1.0/float(fps)) * 1000;
  frames = int(fps * (totalMs/1000));
  
  float emissionsFrames = fps * ((emissionMsEnd-emissionMsStart)/1000);
  particlesPerFrame = round(float(particles) / emissionsFrames);
}

void draw() {
  background(0);
  float ePercent = norm(elapsedMs, emissionMsStart, emissionMsEnd);
  float percent = elapsedMs / totalMs;
  
  if (ePercent >= 0.0) {
    // Retrieve image to use as a reference
    int frame = floor(percent * float(frames-1)) + 1;
    String refImageFile = refImageDir + nf(frame, 4) + ".png";
    PImage refImage = loadImage(refImageFile);
    ps.setRefImage(refImage);
    
    if (ePercent <= 1.0) {
      for(int i=0; i<particlesPerFrame; i++) {
         ps.addParticle();
      }
    }
    
    // Uncomment to show ref image
    //image(refImage, 0, 0);
    
    // run
    ps.run();
  }
  
  if (captureFrames) {
    saveFrame(outputMovieFile); 
  }
  
  // increment time
  elapsedMs += frameMs;
  
  // check if we should exit
  if (elapsedMs > totalMs) {
    exit();
  }
}

void mousePressed() {
  exit();
}


// A class to describe a group of Particles
// An ArrayList is used to manage the list of Particles 

class ParticleSystem {
  ArrayList<Particle> particles;
  PGraphics pg;
  Bounds emitter, deflector;
  float pRadius;

  ParticleSystem(float radius) {
    particles = new ArrayList<Particle>();
    pg = createGraphics(width, height);
    pRadius = radius;
  }

  void addParticle() {
    particles.add(new Particle(emitter, pRadius));
  }

  void run() {
    ArrayList<Bounds> deflectors = new ArrayList<Bounds>();
    deflectors.add(emitter);
    deflectors.add(deflector);
    
    for (int i = particles.size()-1; i >= 0; i--) {
      Particle p = particles.get(i);
      p.run(deflectors);
      if (p.isDead()) {
        particles.remove(i);
      }
    }
  }
  
  void setRefImage(PImage ref) {
    // load pixels
    pg.beginDraw();
    pg.image(ref, 0, 0);
    pg.loadPixels();
    pg.endDraw();
    
    // analyze pixels
    color[] px = pg.pixels;
    emitter = new Bounds(px, "brightness", pRadius);
    deflector = new Bounds(px, "saturation", pRadius);
  }
}

class Bounds {
  int[] data;
  color[] test;
  ArrayList<PVector> dataPoints;
  float pRadius;
  String label;
  
  PVector velocity;
  PVector position;
  
  int chunkSize = 20;
  
  int TOP = 1;
  int BOTTOM = 2;
  int LEFT = 3;
  int RIGHT = 4;
  int MATCH = 5;

  Bounds(color[] px, String mode, float radius) {
    data = new int[width*height];
    dataPoints = new ArrayList<PVector>();
    pRadius = radius;
    label = "";
    
    velocity = new PVector(0, 0);
    position = new PVector(0, 0);
    
    analyzeX(px, mode);
    analyzeY(px, mode);
  }
  
  void analyzeX(color[] px, String mode) {
    for(int y=0; y<height; y++) {
      int minX = -1;
      int maxX = -1;
      for(int x=0; x<width; x++) {
        int loc = x + y * width;
        color c = px[loc];
        if (matches(c, mode)) {
          if (minX < 0) {
            minX = x; 
          }
          maxX = x;
          data[x + y * width] = MATCH;
        }
      }
      if (minX >= 0) {
        data[minX + y * width] = LEFT;
        data[maxX + y * width] = RIGHT;
        dataPoints.add(new PVector(minX, y, LEFT)); 
        dataPoints.add(new PVector(maxX, y, RIGHT)); 
      }
    }
  }
  
  void analyzeY(color[] px, String mode) {
    for(int x=0; x<width; x++) {
      int minY = -1;
      int maxY = -1;
      for(int y=0; y<height; y++) {
        int loc = x + y * width;
        color c = px[loc];
        if (matches(c, mode)) {
          if (minY < 0) {
            minY = y; 
          }
          maxY = y;
          data[x + y * width] = MATCH;
        }
      }
      if (minY >= 0) {
        data[x + minY * width] = TOP;
        data[x + maxY * width] = BOTTOM;
        dataPoints.add(new PVector(x, minY, TOP)); 
        dataPoints.add(new PVector(x, maxY, BOTTOM)); 
      }
    }
  }
  
  String check(PVector p, float radius) {
    String resp = "";
    int tlx = round(p.x - radius/2);
    int tly = round(p.y - radius/2);
    int brx = round(p.x + radius/2);
    int bry = round(p.y + radius/2);
    FloatList xs = new FloatList();
    FloatList ys = new FloatList();
     
    int positions[] = {0,0,0,0,0};
    
    // check for matches
    for (int y=tly; y<=bry; y++) {
      for (int x=tlx; x<=brx; x++) {
        if (isBetween(y, 0, height-1) && isBetween(x, 0, width-1)) {
          int loc = x + y * width;
          int value = data[loc];
          //if (value >= 1 && value <= 4) {
          //  positions[value]++;
          //} else if (value==MATCH) {
          //   PVector closest = getClosestPoint(p);
          //   positions[int(closest.z)]++;
          //}
          if (value > 0) {
            xs.append(float(x));
            ys.append(float(y)); 
          }
        }
      }
    }
    
    if (xs.size() > 0 && ys.size() > 0) {
      float mx = mean(xs);
      float my = mean(ys);
      float angle = angleBetweenPoints(p.x, p.y, mx, my);
      label = ""+angle;
      
      if (angle >= 90-45 && angle < 90+45) {
        resp = "bottom"; 
      } else if (angle >= 180-45 && angle < 180+45){
        resp = "left"; 
      } else if (angle >= 270-45 && angle < 270+45){
        resp = "top"; 
      } else {
        resp = "right"; 
      }
      
    }
    
    // return the position with the most matches
    //int top = positions[TOP];
    //int bottom = positions[BOTTOM];
    //int left = positions[LEFT];
    //int right = positions[RIGHT];
    //if (top+bottom+left+right > 0) {
    //  int pad = 8;
    //  String[] positionCounts = {nf(top, pad)+"top", nf(bottom, pad)+"bottom", nf(left, pad)+"left", nf(right, pad)+"right"};
    //  positionCounts = sort(positionCounts);
    //  resp = positionCounts[3].substring(pad);
    //}
    
    return resp;
  }
  
  void generateRandomVectors() {
    
    // randomly choose a point
    int offset = int(pRadius) * 2;
    int r = round(random(0,dataPoints.size()-1));
    PVector pv = dataPoints.get(r);
    int z = int(pv.z);
    
    float maxV = 2;
    float minV = 1;
    float span = 2;
    
    // determine velocity
    if (z==TOP) {
      position = new PVector(pv.x, pv.y-offset);
      velocity = new PVector(random(-span,span), random(-minV, -maxV));
      
    } else if (z==BOTTOM) {
      position = new PVector(pv.x, pv.y+offset);
      velocity = new PVector(random(-span,span), random(minV, maxV));
      
    } else if (z==LEFT) {
      position = new PVector(pv.x-offset, pv.y);
      velocity = new PVector(random(-minV,-maxV), random(-span,span));
      
    } else if (z==RIGHT) {
      position = new PVector(pv.x+offset, pv.y);
      velocity = new PVector(random(minV,maxV), random(-span,span));
      
    }
  }
  
  PVector getClosestPoint(PVector p){
    PVector closest = dataPoints.get(0).copy();
    float closestD = width * height;
    
    for(PVector dp : dataPoints) {
        
      float d = dist(dp.x, dp.y, p.x, p.y);
      if (d < closestD) {
        closest = dp.copy();
      }
    }
    
    return closest;
  }
  
  String getLabel() {
    return label; 
  }
    
  PVector getVelocityVector() {
    return velocity.copy();
  }
    
  PVector getPositionVector() {
    return position.copy();
  }
  
  boolean matches(color c, String mode) {
    boolean match = false;
    
    // check for saturation
    if (mode.equals("saturation") && saturation(c) > 0.1 && brightness(c) > 0.1) {
      match = true;
      
    // check for brightness
    } else if (mode.equals("brightness") && saturation(c) < 0.1 && brightness(c) > 0.1) {
      match = true; 
    }
    
    return match;
  }
}


// A simple Particle class

class Particle {
  PVector position;
  PVector velocity;
  PVector acceleration;
  float lifespan;
  
  String label;
  
  PVector opposingVelocity;
  PVector opposingAcceleration;
  
  float radius;
  float minVelocity = 0.25;
  float accelStep = 0.0025;

  Particle(Bounds emitter, float rad) {
    radius = rad;
    
    // generate new vectors from emitter
    emitter.generateRandomVectors();
    
    // get velocity from emitter
    velocity = emitter.getVelocityVector();
    
    // determine acceleration
    float axStep = accelStep;
    float ayStep = accelStep;
    if (velocity.x > 0) {
      axStep *= -1; 
    }
    if (velocity.y > 0) {
      ayStep *= -1; 
    }
    acceleration = new PVector(axStep, ayStep);
    
    // get position from emitter
    position = emitter.getPositionVector();
    
    lifespan = 0;
    label = "";
  }

  void run(ArrayList<Bounds> deflectors) {
    update(deflectors);
    display();
  }

  // Method to update position
  void update(ArrayList<Bounds> deflectors) {
    float ax = acceleration.x;
    float ay = acceleration.y;
    float vx = velocity.x;
    float vy = velocity.y;
    float px = position.x;
    float py = position.y;
    
    // apply acceleration
    velocity.add(acceleration);
    
    // don't stop or reverse
    if (abs(velocity.x) < minVelocity) {
      velocity.x = vx;
      acceleration.x = 0;
    }
    if (abs(velocity.y) < minVelocity) {
      velocity.y = vy;
      acceleration.y = 0;
    }
    
    position.add(velocity);
    
    // check for left bounds
    if (position.x < radius/2) {
      position.x = radius/2;
      velocity.x = -vx;
      acceleration.x = -ax;
      
    // check for right bounds
    } else if (position.x > width-radius/2) {
      position.x = width-radius/2;
      velocity.x = -vx;
      acceleration.x = -ax;
    }
    
    // check for top bounds
    if (position.y < radius/2) {
      position.y = radius/2;
      velocity.y = -vy;
      acceleration.y = -ay;
    
    // check for bottom bounds
    } else if (position.y > float(height)*0.75-radius/2) {
      position.y = float(height)*0.75-radius/2;
      velocity.y = -vy;
      acceleration.y = -ay;
    }
    
    // check deflectors
    for (Bounds deflector : deflectors) {
      String resp = deflector.check(position, radius);
      if (!resp.equals("")) {
        position.set(px, py);
        
        //if (label.equals("")) {
        //  label = deflector.getLabel(); 
        //}
        
        if (resp.equals("left") || resp.equals("right")) {
          velocity.x = -vx;
          acceleration.x = -ax;
          
        } else if (resp.equals("top") || resp.equals("bottom")) {
          velocity.y = -vy;
          acceleration.y = -ay;
        }
        
        // test if we're stuck
        PVector testP = position.copy();
        PVector testV = velocity.copy();
        testV.add(acceleration);
        testP.add(testV);
        resp = deflector.check(testP, radius);
        if (!resp.equals("")) {
          velocity.x = -vx / abs(vx) * random(-3,3);
          acceleration.x = -ax / abs(ax) * accelStep;
          velocity.y = -vy / abs(vy) * random(-3,3);
          acceleration.y = -ay / abs(ay) * accelStep;
        }
        
        break;
      }
    }
    
    if (lifespan < 1) {
      lifespan += 0.05; 
    }
  }

  // Method to display
  void display() {
    fill(#FFFFFF, lifespan);
    
    if (!label.equals("")) {
      text(label, position.x, position.y);
      
    } else {
      ellipse(position.x, position.y, radius, radius);
    }
    
  }

  // Is the particle still useful?
  boolean isDead() {
    //if (lifespan < 0.0) {
    //  return true;
    //} else {
    //  return false;
    //}
    return false;
  }
}

float angleBetweenPoints(float x1, float y1, float x2, float y2){
  float deltaX = x2 - x1,
        deltaY = y2 - y1;  
  float angle = atan2(deltaY, deltaX) * 180 / PI;
  angle = angle % 360;    
  if (angle <= 0) {
    angle += 360;
  }
  return angle;
}

boolean isBetween(int value, int low, int high) {
  return (value >= low && value <= high);
}

boolean isBetweenF(float value, float low, float high) {
  return (value >= low && value <= high);
}

float mean(FloatList fl) {
  float sum = 0;
  for (int i=0; i<fl.size(); i++) {
    sum += fl.get(i); 
  }
  return (sum / fl.size());
}