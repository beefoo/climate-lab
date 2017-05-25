boolean captureFrames = true;
String outputMovieFile = "frames/frames-#####.png";
int fps = 30;

String refImageDir = "data/ref/frame";

float elapsedMs = 0;
float emissionMsStart = 2000;
float emissionMsEnd = 10000;
float totalMs = 30000;
float frameMs;
int frames;
int particles = 9855;
int particlesPerFrame = 0;
float particleRadius = 4;

ArrayList<ParticleSystem> ps;
int particleCount = 0;
Table data;

void setup() {
  size(2036, 512);
  frameRate(fps);
  smooth();
  noStroke();
  colorMode(HSB, 1.0);
  
  float emissionsFrames = fps * ((emissionMsEnd-emissionMsStart)/1000);
  particlesPerFrame = round(float(particles) / emissionsFrames);
  
  float xUnit = float(width) / 9.0;
  float yUnit = float(height) / 4.0;
  
  //print(xUnit+","+yUnit+";");
  
  ps = new ArrayList<ParticleSystem>();
  ps.add(new ParticleSystem(xUnit, yUnit, xUnit*5, yUnit*2, particleRadius, 9855, round(9855.0 / emissionsFrames)));
  ps.add(new ParticleSystem(xUnit*7, yUnit*2, xUnit, yUnit, particleRadius, 3, 3));
  
  frameMs = (1.0/float(fps)) * 1000;
  frames = int(fps * (totalMs/1000));
}

void draw() {
  background(0);
  float ePercent = norm(elapsedMs, emissionMsStart, emissionMsEnd);
  
  if (ePercent >= 0.0) {
    for(ParticleSystem p : ps) {
      p.run(); 
    }
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
  float pRadius;
  int pCount, pMax, pPerFrame;
  float x, y, w, h;

  ParticleSystem(float _x, float _y, float _w, float _h, float radius, int count, int perFrame) {
    particles = new ArrayList<Particle>();
    pRadius = radius;
    pMax = count;
    pPerFrame = perFrame;
    pCount = 0;
    x = _x;
    y = _y;
    w = _w;
    h = _h;
  }

  void addParticle() {
    particles.add(new Particle(x, y, w, h, pRadius));
  }

  void run() {
    // add new particles
    if (pCount < pMax) {
      int newCount = min(pMax, pCount+pPerFrame);
      int addCount = newCount - pCount;
      pCount = newCount;
      for (int i=0; i<addCount; i++) {
        addParticle();
      }
    }
    
    
    for (int i = particles.size()-1; i >= 0; i--) {
      Particle p = particles.get(i);
      p.run();
    }
  }
}


// A simple Particle class

class Particle {
  PVector position;
  PVector velocity;
  float x, y, w, h;
  float radius;
  float life;

  Particle(float _x, float _y, float _w, float _h, float rad) {
    radius = rad;
    x = _x;
    y = _y;
    w = _w;
    h = _h;
    life = 0;
    
    float v = 0.8;
    float rw = w * 0.4;
    float rh = h * 0.6;
    position = new PVector(x+w*0.5+random(-rw/2,rw/2), y+h*0.5+random(-rh/2,rh/2));
    velocity = new PVector(random(-v,v), random(-v,v));
  }

  void run() {
    update();
    display();
  }

  // Method to update position
  void update() {
    float vx = velocity.x;
    float vy = velocity.y;
    
    float left = x + radius/2;
    float top = y + radius/2;
    float right = x + w - radius/2;
    float bottom = y + h - radius/2;

    position.add(velocity);
    
    // check for left bounds
    if (position.x < left) {
      position.x = left;
      velocity.x = -vx;
      
    // check for right bounds
    } else if (position.x > right) {
      position.x = right;
      velocity.x = -vx;
    }
    
    // check for top bounds
    if (position.y < top) {
      position.y = top;
      velocity.y = -vy;
    
    // check for bottom bounds
    } else if (position.y > bottom) {
      position.y = bottom;
      velocity.y = -vy;
    }
    
    if (life < 255) {
      life += 0.01; 
    }
  }

  // Method to display
  void display() {
    fill(#FFFFFF, life);
    ellipse(position.x, position.y, radius, radius);
  }
}