// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { Request } from 'express';
// import { Injectable } from '@nestjs/common';
// import { getConfig } from 'src/config';

// const config = getConfig();

// @Injectable()
// export class ResetTokenStrategy extends PassportStrategy(
//   Strategy,
//   'jwt-reset',
// ) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: config.JWT_RESET_SECRET,
//       passReqToCallback: true,
//     });
//   }

//   validate(req: Request, payload: any) {
//     const resetToken = req.get('Authorization').replace('Bearer', '').trim();
//     return { ...payload, resetToken };
//   }
// }
