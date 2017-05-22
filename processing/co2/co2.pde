boolean captureFrames = false;
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
  image(deflectImage, 0, 0);
  
  // set deflector and run
  ps.setDeflector(deflectImage);
  ps.run();
  
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
  PVector force;

  Particle() {
    radius = 8;
    acceleration = new PVector(1.0, random(0.99, 1.0));
    velocity = new PVector(random(-1, 1), random(-3, -1));
    position = new PVector(random(0, width), height);
    force = new PVector(0.0, 0.0);
    lifespan = 255.0;
  }

  void run(color[] deflector) {
    update(deflector);
    display();
  }

  // Method to update position
  void update(color[] deflector) {
    
    float px = position.x;
    float py = position.y;
    float vx = velocity.x * acceleration.x;
    float vy = velocity.y * acceleration.y;

    //velocity.add(force);
    position.add(velocity);
    
    // check for left bounds
    if (position.x < radius/2) {
      position.x = radius/2;
      vx = -vx;
      
    // check for right bounds
    } else if (position.x > width-radius/2) {
      position.x = width-radius/2;
      vx = -vx;
    }
    
    
    
    // check of we hit a deflector
    float tlx = position.x - radius/2;
    float tly = position.y - radius/2;
    float brx = position.x + radius/2;
    float bry = position.y + radius/2;
    FloatList xs = new FloatList();
    FloatList ys = new FloatList();
    for (int y=0; y<height; y++) {
      for (int x=0; x<width; x++) {
        if (x > tlx && x < brx && y > tly && y < bry) {
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
      
      position.x = px;
      position.y = py;

      vy = -vy;
      acceleration = new PVector(1.0, random(0.8, 0.9));
      
    // check for top bounds
    } else if (position.y < radius/2) {
      position.y = radius/2;
      vy = -vy;
      acceleration = new PVector(1.0, random(0.9, 1.0));
    
    // reverse if really slow
    } else if (abs(vy) < 0.01) {
       vy = -vy * 10;
    }
    
    // update velocity
    velocity = new PVector(vx, vy);
      
    //lifespan -= 1.0;
  }

  // Method to display
  void display() {
    //stroke(255, lifespan);
    fill(255, lifespan);
    ellipse(position.x, position.y, radius, radius);
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
  return atan2(deltaY, deltaX) * 180 / PI;
}

float mean(FloatList fl) {
  float sum = 0;
  
  for (int i=0; i<fl.size(); i++) {
    sum += fl.get(i); 
  }
  
  return (sum / fl.size());
}