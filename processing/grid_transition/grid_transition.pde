/**
 * A grid transition mask
 */
 
boolean captureFrames = true;
String outputMovieFile = "frames/frames-#####.png";
int fps = 30;

int gridW = 9;
int gridH = 4;
int grid;
float cellW;
float cellH;

float elapsedMs = 0;
float totalMs = 30000;
float fadeMsMin = 200;
float fadeMsMax = 1000;
float fadeMsOffsetMin = 2000;
float fadeMsOffsetMax = 8000;
float frameMs;

void setup() {
  size(2036, 512);
  frameRate(fps);
  smooth();
  noStroke();
  
  frameMs = (1.0/float(fps)) * 1000;
  
  // grids
  grid = gridW * gridH;
  cellW = 1.0 * width / gridW;
  cellH = 1.0 * height / gridH;

}

void draw() {
   // check if we should exit
   if (elapsedMs > totalMs) {
    exit();
   }
   
   background(0);
  
  for (int y = 0; y < gridH; y++) {
    for (int x = 0; x < gridW; x++) {
      int loc = x + y * gridW;
      
      float cellX = cellW * x;
      float cellY = cellH * y;
      
      float gh = halton(loc, 13);
      float gh2 = halton(loc, 7);
      
      float fadeProgress = 0.0;
      float fadeOffset = lerp(fadeMsOffsetMin, fadeMsOffsetMax, gh2);
      if (elapsedMs > fadeOffset) {
        float fadeDuration = lerp(fadeMsMin, fadeMsMax, gh);
        fadeProgress = (elapsedMs - fadeOffset) / fadeDuration;
      }
      
      if (fadeProgress > 1.0) {
        fadeProgress = 1.0;
      }
      
      fill(#FFFFFF, fadeProgress*255);
      rect(cellX, cellY, cellW, cellH);
    }
  }
  
  if (captureFrames) {
    saveFrame(outputMovieFile); 
  }
  
  // increment time
  elapsedMs += frameMs;
  
}

void mousePressed() {
  exit();
}

float halton(int hIndex, int hBase) {    
  float result = 0;
  float f = 1.0 / hBase;
  int i = hIndex;
  while(i > 0) {
    result = result + f * float(i % hBase);
    
    i = floor(i / hBase);
    f = f / float(hBase);
  }
  return result;
}