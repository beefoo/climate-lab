boolean captureFrames = true;
String outputMovieFile = "frames/frames-#####.png";
int fps = 30;

String dataFile = "global.1751_2014.csv";
String deflectImageDir = "data/co2_text_deflect/frame";

float elapsedMs = 0;
float emissionMs = 20000;
float totalMs = 30000;
float frameMs;
int frames;

ParticleSystem ps;
int particleCount = 0;

Table data;

void setup() {
  size(2036, 512);
  frameRate(fps);
  smooth();
  noStroke();
  
  data = loadTable(dataFile, "header");
  
  ps = new ParticleSystem();
  frameMs = (1.0/float(fps)) * 1000;
  frames = int(fps * (totalMs/1000));
}

void draw() {
  background(0);
  float ePercent = elapsedMs / emissionMs;
  float percent = elapsedMs / totalMs;
  
  if (ePercent <= 1.0) {
    int rowIndex = floor(ePercent * float(data.getRowCount()-1));
    TableRow row = data.getRow(rowIndex);
    int total = row.getInt("total");
    
    // add more particles
    if (total > particleCount) {
      int addParticles = total -  particleCount;
      for(int i=0; i<addParticles; i++) {
         ps.addParticle();
      }
      particleCount = total;
    }
  }
  
  // Retrieve image to use as a deflector
  int frame = floor(percent * float(frames-1)) + 1;
  String deflectImageFile = deflectImageDir + nf(frame, 4) + ".png";
  PImage deflectImage = loadImage(deflectImageFile);
  
  // Uncomment to show deflector image
  // image(deflectImage, 0, 0);
  
  // set deflector and run
  ps.setDeflector(deflectImage);
  ps.run();
  
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

  ParticleSystem() {
    particles = new ArrayList<Particle>();
    pg = createGraphics(width, height);
  }

  void addParticle() {
    particles.add(new Particle());
  }

  void run() {
    for (int i = particles.size()-1; i >= 0; i--) {
      Particle p = particles.get(i);
      p.run(pg.pixels);
      if (p.isDead()) {
        particles.remove(i);
      }
    }
  }
  
  void setDeflector(PImage deflector) {
    pg.beginDraw();
    pg.image(deflector, 0, 0);
    pg.loadPixels();
    pg.endDraw();
  }
}


// A simple Particle class

class Particle {
  PVector position;
  PVector velocity;
  PVector acceleration;
  float lifespan;
  float radius;
  float angle;
  String label;
  
  PVector opposingVelocity;
  PVector opposingAcceleration;

  Particle() {
    radius = 8;
    // slowly decelerate
    acceleration = new PVector(1.0, random(0.99, 1.0));
    // x can go left or right, y only up
    velocity = new PVector(random(-1, 1), random(-3, -2));
    // start randomly on the bottom
    position = new PVector(random(0, width), height);
    
    // initialize velocity/accel for deflectors
    opposingVelocity = new PVector(0.0, 0.0);
    opposingAcceleration = new PVector(1.0, 1.0);
    
    lifespan = 255.0;
    label = "";
  }

  void run(color[] deflector) {
    update(deflector);
    display();
  }

  // Method to update position
  void update(color[] deflector) {
    
    float px = position.x;
    float py = position.y;
    float vx = velocity.x;
    float vy = velocity.y;
    
    // apply opposing force
    PVector v = velocity.copy();
    v.add(opposingVelocity);
    opposingVelocity.x = opposingVelocity.x * opposingAcceleration.x;
    opposingVelocity.y = opposingVelocity.y * opposingAcceleration.y;

    position.add(v);
    
    // check for left bounds
    if (position.x < radius/2) {
      position.x = radius/2;
      vx = -vx;
      
    // check for right bounds
    } else if (position.x > width-radius/2) {
      position.x = width-radius/2;
      vx = -vx;
    }
    
    // check for top bounds
    if (position.y < radius/2) {
      position.y = radius/2;
      vy = -vy;
      acceleration = new PVector(1.0, random(0.9, 1.0));
      
    // check for deflector
    } else {
      int tlx = round(position.x - radius/2);
      int tly = round(position.y - radius/2);
      int brx = round(position.x + radius/2);
      int bry = round(position.y + radius/2);
      FloatList xs = new FloatList();
      FloatList ys = new FloatList();
      
      for (int y=tly; y<=bry; y++) {
        for (int x=tlx; x<=brx; x++) {
          if (isBetween(y, 0, height-1) && isBetween(x, 0, width-1)) {
            int loc = x + y * width;
            color c = deflector[loc];
            if (brightness(c) > 0.1) {
               xs.append(float(x));
               ys.append(float(y));
            }
          }
        }
      }
      
      // deflector hit, calculate avg
      if (xs.size() > 0 && ys.size() > 0) {
        float mx = mean(xs);
        float my = mean(ys);
        float angle = angleBetweenPoints(position.x, position.y, mx, my);
        
        // Uncomment to show angle
        // label = ""+int(angle);
        
        position.x = px;
        position.y = py;
        
        float opposingDirection = (-1.0 * vy) / abs(vy);
        opposingVelocity = new PVector(0.0, opposingDirection * abs(vy*2));
        opposingAcceleration = new PVector(1.0, random(0.95, 0.99));
        
        // hit left/right
        if (!(isBetweenF(angle, 270.0-45, 270.+45) || isBetweenF(angle, 90.0-45, 90.+45))) {
          vx = -vx;
        }
        
        
      }
    }
    
    // (de)accelerate
    vx = vx * acceleration.x;
    vy = vy * acceleration.y;
    
    // update velocity
    velocity = new PVector(vx, vy);
    
    // Uncomment to let particles die
    // lifespan -= 1.0;
  }

  // Method to display
  void display() {
    fill(255, lifespan);
    
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