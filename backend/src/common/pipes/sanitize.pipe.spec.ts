import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => {
    pipe = new SanitizePipe();
  });

  it('should remove HTML tags from strings', () => {
    const input = '<script>alert("xss")</script>Hello <p>world</p>';
    const output = pipe.transform(input, {} as any);
    expect(output).toBe('alert("xss")Hello world');
  });

  it('should sanitize strings inside objects', () => {
    const input = {
      name: '<b>John</b>',
      bio: '<a href="javascript:void(0)">Bio</a>',
      nested: {
        text: '<i>Italic</i>'
      }
    };
    const output = pipe.transform(input, {} as any);
    expect(output).toEqual({
      name: 'John',
      bio: 'Bio',
      nested: {
        text: 'Italic'
      }
    });
  });

  it('should return non-string values as is', () => {
    expect(pipe.transform(123, {} as any)).toBe(123);
    expect(pipe.transform(true, {} as any)).toBe(true);
    expect(pipe.transform(null, {} as any)).toBe(null);
  });
});
