import { TestBed, async } from '@angular/core/testing';
import { ScheduleComponent } from './schedule.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ScheduleComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(ScheduleComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Angular6App'`, () => {
    const fixture = TestBed.createComponent(ScheduleComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Angular6App');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(ScheduleComponent);
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
