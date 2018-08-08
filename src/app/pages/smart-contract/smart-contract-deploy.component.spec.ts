import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartContractDeployComponent } from './smart-contract-deploy.component';

describe('SmartContractDeployComponent', () => {
  let component: SmartContractDeployComponent;
  let fixture: ComponentFixture<SmartContractDeployComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmartContractDeployComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartContractDeployComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
