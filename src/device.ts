export interface Device {
  id: string;
  name?: string;
  address: number[];
  type: string;
  profile: string;
  state?: string;
}
